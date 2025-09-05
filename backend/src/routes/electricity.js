import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import ElectricityService from '../models/ElectricityService.js'
import { fetchApspdclBill } from '../services/apspdcl.js'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { istDayKey, getAdminUsers, getElectricityRefreshCap, getSubscribedUsers, getFreeLimit, getElectricityRefreshWaitMs } from '../config/limits.js'

const router = Router()
router.use(requireAuth)

const ADMIN_USERS = getAdminUsers()
const ELECTRICITY_REFRESH_RATE_LIMIT_PER_DAY = getElectricityRefreshCap()
const elecLimiter = rateLimit({
  windowMs: 24*60*60*1000,
  max: ELECTRICITY_REFRESH_RATE_LIMIT_PER_DAY,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> `${req.user?.id || ipKeyGenerator(req)}:${istDayKey()}`,
  skip: (req)=> ADMIN_USERS.includes((req.user?.email||'').toLowerCase()),
  handler: (_req, res)=> res.status(429).json({ error: `Rate limit exceeded (ELECTRICITY_REFRESH_RATE_LIMIT_PER_DAY/day) for Non-Subscriber users. Please try tomorrow.` })
})

async function validateApspdclServiceNumber(sn){
  try{
    const resp = await fetch('https://apspdcl.in/ConsumerDashboard/public/publicbillhistory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ uscno: sn }).toString(),
    })
    if (!resp.ok) return { ok:false, reason:'gateway' }
    const json = await resp.json()
    if (Array.isArray(json?.data) && json.data.length > 0) return { ok:true }
    if (json?.status === 'error') return { ok:false, reason:'invalid' }
    return { ok:false, reason:'gateway' }
  }catch{
    return { ok:false, reason:'gateway' }
  }
}

// List services
router.get('/services', async (req,res,next)=>{
  try{
    const items = await ElectricityService.find({ userId: req.user.id, isDeleted: { $ne: true } }).sort({ pinned: -1, pinnedAt: 1, createdAt: -1 })
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
      pinned: !!s.pinned,
      pinnedAt: s.pinnedAt || null,
      // Enhanced payment information
      isPaid: s.isPaid || false,
      paidDate: s.paidDate || null,
      receiptNumber: s.receiptNumber || null,
      paidAmount: s.paidAmount || null,
    })))
  }catch(e){ next(e) }
})

// List trashed services
router.get('/services/trash', async (req,res,next)=>{
  try{
    const items = await ElectricityService.find({ userId: req.user.id, isDeleted: true }).sort({ deletedAt: -1 })
    res.json(items.map(s=> ({
      id: s._id,
      label: s.label,
      serviceNumber: s.serviceNumber,
      deletedAt: s.deletedAt,
    })))
  }catch(e){ next(e) }
})

// Add service
router.post('/services', async (req,res,next)=>{
  try{
    const { serviceNumber, label } = req.body || {}
    if(!serviceNumber) return res.status(400).json({ error: 'serviceNumber required' })
    const sn = String(serviceNumber).trim()
    if (!/^\d{13}$/.test(sn)) return res.status(400).json({ error: 'Service Number must be 13 digits' })
    const SUBSCRIBED_USERS = getSubscribedUsers()
    const isPrivileged = ADMIN_USERS.includes((req.user?.email||'').toLowerCase()) || SUBSCRIBED_USERS.includes((req.user?.email||'').toLowerCase())
    if (!isPrivileged){
      const maxFree = getFreeLimit()
      const activeCount = await ElectricityService.countDocuments({ userId: req.user.id, isDeleted: { $ne: true } })
      if (activeCount >= maxFree) return res.status(403).json({ error: `Non subscriber user can only have upto ${maxFree} accounts` })
    }
    const existsSvc = await ElectricityService.findOne({ userId: req.user.id, serviceNumber: sn, isDeleted: { $ne: true } })
    if (existsSvc) return res.status(409).json({ error: 'Service number already exists' })
    if (label){
      const existsLabel = await ElectricityService.findOne({ userId: req.user.id, label: (label||'').trim(), isDeleted: { $ne: true } })
      if (existsLabel) return res.status(409).json({ error: 'Label already exists' })
    }
    // Validate with APSPDCL before saving
    const val = await validateApspdclServiceNumber(sn)
    if (!val.ok){
      if (val.reason==='invalid') return res.status(400).json({ error: 'Invalid Service Number' })
      return res.status(502).json({ error: 'APSPDCL validation failed. Try again later.' })
    }
    const created = await ElectricityService.create({ userId: req.user.id, serviceNumber: sn, label: (label||'').trim() || undefined })
    res.status(201).json({ id: created._id })
  }catch(e){
    if (e?.code === 11000){
      try{
        const existing = await ElectricityService.findOne({ userId: req.user.id, serviceNumber: String(req.body?.serviceNumber||'').trim() })
        if (existing && existing.isDeleted){
          return res.status(409).json({ error: 'Service exists in Trash. You can restore it.', canRestore: true, id: existing._id })
        }
      }catch{}
      return res.status(409).json({ error: 'Service already exists' })
    }
    next(e)
  }
})

// Update service (label/serviceNumber)
router.put('/services/:id', async (req,res,next)=>{
  try{
    const { serviceNumber, label, pinned } = req.body || {}
    const update = {}
    if (serviceNumber){
      const sn = String(serviceNumber).trim()
      if (!/^\d{13}$/.test(sn)) return res.status(400).json({ error: 'Service Number must be 13 digits' })
      const dupSvc = await ElectricityService.findOne({ userId: req.user.id, serviceNumber: sn, _id: { $ne: req.params.id }, isDeleted: { $ne: true } })
      if (dupSvc) return res.status(409).json({ error: 'Service number already exists' })
      const val = await validateApspdclServiceNumber(sn)
      if (!val.ok){
        if (val.reason==='invalid') return res.status(400).json({ error: 'Invalid Service Number' })
        return res.status(502).json({ error: 'APSPDCL validation failed. Try again later.' })
      }
      update.serviceNumber = sn
    }
    if (label !== undefined){
      if (label){
        const dupLabel = await ElectricityService.findOne({ userId: req.user.id, label: (label||'').trim(), _id: { $ne: req.params.id }, isDeleted: { $ne: true } })
        if (dupLabel) return res.status(409).json({ error: 'Label already exists' })
      }
      update.label = (label||'').trim()
    }
    if (typeof pinned === 'boolean'){
      update.pinned = pinned
      update.pinnedAt = pinned ? new Date() : null
    }
    await ElectricityService.updateOne({ _id: req.params.id, userId: req.user.id }, update)
    res.json({ ok: true })
  }catch(e){ next(e) }
})

// Delete service
router.delete('/services/:id', async (req,res,next)=>{
  try{
    const hard = String(req.query?.hard||'').toLowerCase()==='true'
    if (hard){
      await ElectricityService.deleteOne({ _id: req.params.id, userId: req.user.id })
      return res.json({ ok: true, deleted: 'permanent' })
    }
    await ElectricityService.updateOne({ _id: req.params.id, userId: req.user.id }, { isDeleted: true, deletedAt: new Date() })
    res.json({ ok: true, deleted: 'soft' })
  }catch(e){ next(e) }
})

// Permanent delete from trash
router.delete('/services/permanent/:id', async (req,res,next)=>{
  try{
    await ElectricityService.deleteOne({ _id: req.params.id, userId: req.user.id })
    res.json({ ok: true })
  }catch(e){ next(e) }
})
// Restore
router.post('/services/restore/:id', async (req,res,next)=>{
  try{
    await ElectricityService.updateOne({ _id: req.params.id, userId: req.user.id }, { isDeleted: false, deletedAt: null })
    res.json({ ok: true })
  }catch(e){ next(e) }
})

// Refresh one
router.post('/services/:id/refresh', elecLimiter, async (req,res,next)=>{
  try{
    const cooldownMs = getElectricityRefreshWaitMs()
    const svc = await ElectricityService.findOne({ _id: req.params.id, userId: req.user.id })
    if(!svc) return res.status(404).json({ error: 'Not found' })
    const isAdmin = ADMIN_USERS.includes((req.user?.email||'').toLowerCase())
    if (!isAdmin && svc.refreshInProgress){
      const staleMs = Number(process.env.REFRESH_LOCK_STALE_MS || 2*60*1000)
      const updatedAt = svc.updatedAt ? new Date(svc.updatedAt).getTime() : 0
      if (!updatedAt || (Date.now() - updatedAt) > staleMs){
        svc.refreshInProgress = false
        await svc.save()
      } else {
        return res.status(409).json({ error: 'Already refreshing' })
      }
    }
    if (!isAdmin && svc.nextAllowedAt && svc.nextAllowedAt > new Date()){
      const wait = Math.ceil((svc.nextAllowedAt - new Date())/1000)
      return res.status(429).json({ error: `Please wait ${wait}s` })
    }
    svc.refreshInProgress = true
    await svc.save()
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
    // Enhanced payment information
    svc.isPaid = result.isPaid || false
    svc.paidDate = result.paidDate || null
    svc.receiptNumber = result.receiptNumber || null
    svc.paidAmount = result.paidAmount || null
    if (!isAdmin) svc.nextAllowedAt = new Date(Date.now() + cooldownMs) // only on success
    svc.lastError = null
    svc.refreshInProgress = false
    await svc.save()
    res.json({ id: svc._id, ...result })
  }catch(e){
    try{
      const svc = await ElectricityService.findOne({ _id: req.params.id, userId: req.user.id })
      if (svc){ svc.refreshInProgress = false; await svc.save() }
    }catch{}
    next(e)
  }
})

// Refresh all
router.post('/services/refresh-all', elecLimiter, async (req,res,next)=>{
  try{
    const { batchSize = 3 } = req.body || {}
    const list = await ElectricityService.find({ userId: req.user.id }).sort({ createdAt: -1 })
    const isAdmin = ADMIN_USERS.includes((req.user?.email||'').toLowerCase())
    const results = []
    for(let i=0;i<list.length;i+=batchSize){
      const batch = list.slice(i,i+batchSize)
      const settled = await Promise.allSettled(batch.map(async svc=>{
        try{
          if (!isAdmin){
            if (svc.refreshInProgress){
              const staleMs = Number(process.env.REFRESH_LOCK_STALE_MS || 2*60*1000)
              const updatedAt = svc.updatedAt ? new Date(svc.updatedAt).getTime() : 0
              if (!updatedAt || (Date.now() - updatedAt) <= staleMs){
                return { id: svc._id, skipped: true, reason: 'in-progress' }
              }
              svc.refreshInProgress = false
              await svc.save()
            }
            if (svc.nextAllowedAt && svc.nextAllowedAt > new Date()) return { id: svc._id, skipped: true, reason: 'cooldown' }
          }
          svc.refreshInProgress = true
          await svc.save()
          const result = await fetchApspdclBill({ serviceNumber: svc.serviceNumber, interactive: false })
          svc.customerName = result.customerName
          svc.lastBillDate = result.billDate
          svc.lastDueDate = result.dueDate
          svc.lastAmountDue = result.amountDue
          svc.lastBilledUnits = result.billedUnits || 0
          svc.lastThreeAmounts = Array.isArray(result.lastThreeAmounts)? result.lastThreeAmounts : []
          svc.lastStatus = result.status
          svc.lastFetchedAt = new Date()
          // Enhanced payment information
          svc.isPaid = result.isPaid || false
          svc.paidDate = result.paidDate || null
          svc.receiptNumber = result.receiptNumber || null
          svc.paidAmount = result.paidAmount || null
          if (!isAdmin) svc.nextAllowedAt = new Date(Date.now() + getElectricityRefreshWaitMs()) // only on success
          svc.lastError = null
          svc.refreshInProgress = false
          await svc.save()
          return { id: svc._id, ok: true }
        }catch(err){
          svc.lastError = err?.message || 'Failed to fetch bill'
          svc.lastFetchedAt = new Date()
          try{ svc.refreshInProgress = false; await svc.save() }catch{}
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

