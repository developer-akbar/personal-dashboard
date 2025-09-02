import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import ElectricityService from '../models/ElectricityService.js'
import { fetchApspdclBill } from '../services/apspdcl.js'
import rateLimit from 'express-rate-limit'

const router = Router()
router.use(requireAuth)

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(s=> s.trim().toLowerCase()).filter(Boolean)
const elecLimiter = rateLimit({
  windowMs: 24*60*60*1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> req.user?.id || req.ip,
  skip: (req)=> ADMIN_EMAILS.includes((req.user?.email||'').toLowerCase()),
  handler: (_req, res)=> res.status(429).json({ error: 'Rate limit exceeded (10/day). Please try tomorrow.' })
})

// List services
router.get('/services', async (req,res,next)=>{
  try{
    const items = await ElectricityService.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(items.map(s=> ({
      id: s._id,
      label: s.label,
      serviceNumber: s.serviceNumber,
      customerName: s.customerName,
      lastBillDate: s.lastBillDate,
      lastDueDate: s.lastDueDate,
      lastAmountDue: s.lastAmountDue,
      lastBilledUnits: s.lastBilledUnits,
      lastThreeAmounts: s.lastThreeAmounts,
      lastStatus: s.lastStatus,
      lastFetchedAt: s.lastFetchedAt,
      lastError: s.lastError,
    })))
  }catch(e){ next(e) }
})

// Add service
router.post('/services', async (req,res,next)=>{
  try{
    const { serviceNumber, label } = req.body || {}
    if(!serviceNumber) return res.status(400).json({ error: 'serviceNumber required' })
    const existsSvc = await ElectricityService.findOne({ userId: req.user.id, serviceNumber: String(serviceNumber).trim() })
    if (existsSvc) return res.status(409).json({ error: 'Service number already exists' })
    if (label){
      const existsLabel = await ElectricityService.findOne({ userId: req.user.id, label: (label||'').trim() })
      if (existsLabel) return res.status(409).json({ error: 'Label already exists' })
    }
    const created = await ElectricityService.create({ userId: req.user.id, serviceNumber: String(serviceNumber).trim(), label: (label||'').trim() || undefined })
    res.status(201).json({ id: created._id })
  }catch(e){
    if (e?.code === 11000) return res.status(409).json({ error: 'Service already exists' })
    next(e)
  }
})

// Update service (label/serviceNumber)
router.put('/services/:id', async (req,res,next)=>{
  try{
    const { serviceNumber, label } = req.body || {}
    const update = {}
    if (serviceNumber){
      const dupSvc = await ElectricityService.findOne({ userId: req.user.id, serviceNumber: String(serviceNumber).trim(), _id: { $ne: req.params.id } })
      if (dupSvc) return res.status(409).json({ error: 'Service number already exists' })
      update.serviceNumber = String(serviceNumber).trim()
    }
    if (label !== undefined){
      if (label){
        const dupLabel = await ElectricityService.findOne({ userId: req.user.id, label: (label||'').trim(), _id: { $ne: req.params.id } })
        if (dupLabel) return res.status(409).json({ error: 'Label already exists' })
      }
      update.label = (label||'').trim()
    }
    await ElectricityService.updateOne({ _id: req.params.id, userId: req.user.id }, update)
    res.json({ ok: true })
  }catch(e){ next(e) }
})

// Delete service
router.delete('/services/:id', async (req,res,next)=>{
  try{
    await ElectricityService.deleteOne({ _id: req.params.id, userId: req.user.id })
    res.json({ ok: true })
  }catch(e){ next(e) }
})

// Refresh one
router.post('/services/:id/refresh', elecLimiter, async (req,res,next)=>{
  try{
    const svc = await ElectricityService.findOne({ _id: req.params.id, userId: req.user.id })
    if(!svc) return res.status(404).json({ error: 'Not found' })
    const { serviceNumber } = svc
    const result = await fetchApspdclBill({ serviceNumber, interactive: false })
    svc.customerName = result.customerName
    svc.lastBillDate = result.billDate
    svc.lastDueDate = result.dueDate
    svc.lastAmountDue = result.amountDue
    svc.lastBilledUnits = result.billedUnits || 0
    svc.lastThreeAmounts = Array.isArray(result.lastThreeAmounts)? result.lastThreeAmounts : []
    svc.lastStatus = result.status
    svc.lastFetchedAt = new Date()
    svc.lastError = null
    await svc.save()
    res.json({ id: svc._id, ...result })
  }catch(e){ next(e) }
})

// Refresh all
router.post('/services/refresh-all', elecLimiter, async (req,res,next)=>{
  try{
    const { batchSize = 3 } = req.body || {}
    const list = await ElectricityService.find({ userId: req.user.id }).sort({ createdAt: -1 })
    const results = []
    for(let i=0;i<list.length;i+=batchSize){
      const batch = list.slice(i,i+batchSize)
      const settled = await Promise.allSettled(batch.map(async svc=>{
        try{
          const result = await fetchApspdclBill({ serviceNumber: svc.serviceNumber, interactive: false })
          svc.customerName = result.customerName
          svc.lastBillDate = result.billDate
          svc.lastDueDate = result.dueDate
          svc.lastAmountDue = result.amountDue
          svc.lastBilledUnits = result.billedUnits || 0
          svc.lastThreeAmounts = Array.isArray(result.lastThreeAmounts)? result.lastThreeAmounts : []
          svc.lastStatus = result.status
          svc.lastFetchedAt = new Date()
          svc.lastError = null
          await svc.save()
          return { id: svc._id, ok: true }
        }catch(err){
          svc.lastError = err?.message || 'Failed to fetch bill'
          svc.lastFetchedAt = new Date()
          await svc.save()
          throw err
        }
      }))
      results.push(...settled.map(x=> x.status==='fulfilled'? x.value : { error: x.reason?.message||String(x.reason) }))
    }
    res.json({ results })
  }catch(e){ next(e) }
})

export default router

