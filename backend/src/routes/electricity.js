import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import ElectricityService from '../models/ElectricityService.js'
import { fetchApspdclBill } from '../services/apspdcl.js'

const router = Router()
router.use(requireAuth)

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
    if (serviceNumber) update.serviceNumber = String(serviceNumber).trim()
    if (label !== undefined) update.label = (label||'').trim()
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
router.post('/services/:id/refresh', async (req,res,next)=>{
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
router.post('/services/refresh-all', async (req,res,next)=>{
  try{
    const { batchSize = 3 } = req.body || {}
    const list = await ElectricityService.find({ userId: req.user.id }).sort({ createdAt: -1 })
    const results = []
    for(let i=0;i<list.length;i+=batchSize){
      const batch = list.slice(i,i+batchSize)
      const settled = await Promise.allSettled(batch.map(async svc=>{
        const result = await fetchApspdclBill({ serviceNumber: svc.serviceNumber, interactive: false })
        svc.customerName = result.customerName
        svc.lastBillDate = result.billDate
        svc.lastDueDate = result.dueDate
        svc.lastAmountDue = result.amountDue
        svc.lastStatus = result.status
        svc.lastFetchedAt = new Date()
        svc.lastError = null
        await svc.save()
        return { id: svc._id, ok: true }
      }))
      results.push(...settled.map(x=> x.status==='fulfilled'? x.value : { error: x.reason?.message||String(x.reason) }))
    }
    res.json({ results })
  }catch(e){ next(e) }
})

export default router

