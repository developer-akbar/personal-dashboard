Redis-backed Rate Limiting (Cluster-safe)

This app currently uses express-rate-limit with in-memory counters and an IST day key (YYYYMMDD) so limits reset at midnight IST. In-memory counters are per-process; if you run multiple backend instances, each instance will keep its own counters, so users could exceed limits by hitting different instances.

Using a Redis-backed store centralizes counters across all instances and ensures cluster-wide enforcement.

When you need this
- You deploy multiple backend instances (horizontal scaling, autoscaling, or PM2 cluster mode)
- You want accurate, shared daily limits regardless of which instance handles the request

If you run a single instance, the current in-memory limiter is sufficient and you do not need Redis.

Architecture
- All instances connect to the same Redis
- Rate-limit keys use: <userId or ip>:<IST_DAY_KEY>
- Redis increments counters atomically and enforces the max per window

Setup Steps

1) Provision Redis
- Options: Render Redis, Upstash, Redis Enterprise, or self-host
- Capture the URL (e.g., REDIS_URL=redis://default:password@host:port)

2) Add dependencies
```bash
npm i rate-limit-redis ioredis
```

3) Wire the Redis store in the limiters
Update your limiters to use rate-limit-redis and ioredis, reusing the IST day key. Example for Amazon balances limiter:
```js
import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import Redis from 'ioredis'
import { istDayKey, getAmazonRefreshCap, getAdminUsers } from '../config/limits.js'

const redis = new Redis(process.env.REDIS_URL)
const ADMIN_USERS = getAdminUsers()
const AMAZON_REFRESH_RATE_LIMIT_PER_DAY = getAmazonRefreshCap()

const refreshLimiter = rateLimit({
  windowMs: 24*60*60*1000,
  max: AMAZON_REFRESH_RATE_LIMIT_PER_DAY,
  keyGenerator: (req)=> `${req.user?.id || req.ip}:${istDayKey()}`,
  skip: (req)=> ADMIN_USERS.includes((req.user?.email||'').toLowerCase()),
  handler: (_req, res)=> res.status(429).json({ error: 'Rate limit exceeded (AMAZON_REFRESH_RATE_LIMIT_PER_DAY/day) for Non-Subscriber users. Please try tomorrow.' }),
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  })
})
```
Repeat similarly for the Electricity limiter.

4) Environment variables
- REDIS_URL should be set in your backend environment

5) Operational notes
- Redis must be reachable from all backend instances
- Monitor Redis latency and connection limits
- Keys will naturally roll over daily due to the IST day key

FAQ

- Does Redis change the message or reset timing?
  - No. Messages remain the same. Reset timing continues at midnight IST because we still include the IST day key in the limiter key.

- Can I share Redis with other features?
  - Yes, but use prefixes (e.g., rl:) or a separate DB index to avoid key collisions.

- Is Upstash free tier enough?
  - Usually fine for modest traffic; evaluate per your workload.

