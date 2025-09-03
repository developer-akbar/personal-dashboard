import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getAdminUsers, getSubscribedUsers, getFreeLimit, getAmazonRefreshCap, getElectricityRefreshCap, istDayKey } from '../config/limits.js'

const router = Router()
router.use(requireAuth)

router.get('/limits', async (req,res)=>{
  const email = (req.user?.email||'').toLowerCase()
  const admin = getAdminUsers().includes(email)
  const subscribed = getSubscribedUsers().includes(email)
  res.json({
    isAdmin: admin,
    isSubscribed: subscribed,
    freeCardsLimit: getFreeLimit(),
    amazonRefreshPerDay: getAmazonRefreshCap(),
    electricityRefreshPerDay: getElectricityRefreshCap(),
    resetKey: istDayKey(),
  })
})

export default router

