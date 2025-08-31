import { Router } from 'express'
import AmazonAccount from '../models/AmazonAccount.js'
import { requireAuth } from '../middleware/auth.js'
import { decryptSecret } from '../utils/crypto.js'
import { fetchAmazonRewards } from '../services/scraper.js'

const router = Router()
router.use(requireAuth)

// GET /rewards/:accountId - fetch live rewards (and cache)
router.get('/:accountId', async (req,res,next)=>{
  try{
    const account = await AmazonAccount.findOne({ _id: req.params.accountId, userId: req.user.id, isDeleted: { $ne: true } })
    if(!account) return res.status(404).json({ error: 'Account not found' })
    const password = decryptSecret(account.encryptedPassword)
    const { rewards, storageState, debug } = await fetchAmazonRewards({
      region: account.region,
      email: account.email,
      password,
      interactive: process.env.NODE_ENV !== 'production',
      storageState: account.storageState,
    })
    if (storageState) account.storageState = storageState
    account.lastRewards = rewards
    account.lastRewardsAt = new Date()
    account.lastRewardsError = null
    await account.save()
    const wantDebug = String(req.query.debug||'').toLowerCase() === '1'
    res.json(wantDebug ? { accountId: account.id, rewards, debug } : { accountId: account.id, rewards })
  }catch(e){
    try{ await AmazonAccount.updateOne({ _id: req.params.accountId }, { lastRewardsError: e.message }) }catch{}
    next(e)
  }
})

// POST /rewards/refresh-all - fetch rewards for all accounts (concurrently)
router.post('/refresh-all', async (req,res,next)=>{
  try{
    const { batchSize = 3, debug=false } = req.body || {}
    const accounts = await AmazonAccount.find({ userId: req.user.id, isDeleted: { $ne: true } }).sort({ order: 1, createdAt: 1 })
    const results = []
    const errors = []
    for (let i=0; i<accounts.length; i+=batchSize){
      const batch = accounts.slice(i, i+batchSize)
      const settled = await Promise.allSettled(batch.map(async (account)=>{
        const password = decryptSecret(account.encryptedPassword)
        const { rewards, storageState, debug: dbg } = await fetchAmazonRewards({
          region: account.region,
          email: account.email,
          password,
          interactive: process.env.NODE_ENV !== 'production',
          storageState: account.storageState,
        })
        if (storageState) account.storageState = storageState
        account.lastRewards = rewards
        account.lastRewardsAt = new Date()
        account.lastRewardsError = null
        await account.save()
        return debug ? { accountId: account.id, rewardsCount: rewards.length, debug: dbg } : { accountId: account.id, rewardsCount: rewards.length }
      }))
      settled.forEach(s=>{
        if (s.status === 'fulfilled') results.push(s.value)
        else errors.push(s.reason?.message || String(s.reason))
      })
    }
    res.json({ results, errors })
  }catch(e){ next(e) }
})

export default router

