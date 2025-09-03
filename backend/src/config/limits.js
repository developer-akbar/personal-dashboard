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

function parseDurationMs(input, defaultSeconds){
  const raw = (input==null? '': String(input)).trim().toLowerCase()
  if (!raw) return defaultSeconds * 1000
  if (/^\d+ms$/.test(raw)) return Number(raw.replace('ms',''))
  if (/^\d+s$/.test(raw)) return Number(raw.replace('s','')) * 1000
  if (/^\d+m$/.test(raw)) return Number(raw.replace('m','')) * 60 * 1000
  const n = Number(raw)
  if (!Number.isFinite(n)) return defaultSeconds * 1000
  return n * 1000
}

export function getAmazonRefreshWaitMs(){
  return parseDurationMs(process.env.AMAZON_REFRESH_WAITING_TIME, 120)
}

export function getElectricityRefreshWaitMs(){
  return parseDurationMs(process.env.ELECTRICITY_REFRESH_WAITING_TIME, 120)
}

