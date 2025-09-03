export function getAdminUsers(){
  return (process.env.ADMIN_USERS || '').split(',').map(s=> s.trim().toLowerCase()).filter(Boolean)
}

export function getSubscribedUsers(){
  return (process.env.SUBSCRIBED_USERS || '').split(',').map(s=> s.trim().toLowerCase()).filter(Boolean)
}

export function getFreeLimit(){
  return Number(process.env.ALLOWED_FREE_USER_CARDS_COUNT || 3)
}

export function getAmazonRefreshCap(){
  return Number(process.env.AMAZON_REFRESH_RATE_LIMIT_PER_DAY || 3)
}

export function getElectricityRefreshCap(){
  return Number(process.env.ELECTRICITY_REFRESH_RATE_LIMIT_PER_DAY || 5)
}

// Returns YYYYMMDD string in IST (Asia/Kolkata)
export function istDayKey(){
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  const ist = new Date(Date.now() + IST_OFFSET_MS)
  const y = ist.getUTCFullYear()
  const m = String(ist.getUTCMonth()+1).padStart(2,'0')
  const d = String(ist.getUTCDate()).padStart(2,'0')
  return `${y}${m}${d}`
}

