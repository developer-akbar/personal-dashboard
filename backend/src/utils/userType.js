import { getAdminUsers, getSubscribedUsers } from '../config/limits.js'

export function determineUserType(user) {
  const adminUsers = getAdminUsers()
  const subscribedUsers = getSubscribedUsers()
  
  const email = user.email?.toLowerCase()
  
  console.log('🔍 User Type Detection Debug:')
  console.log('- User email:', user.email)
  console.log('- Lowercase email:', email)
  console.log('- Admin users list:', adminUsers)
  console.log('- Subscribed users list:', subscribedUsers)
  console.log('- Is admin?', adminUsers.includes(email))
  console.log('- Is subscribed?', subscribedUsers.includes(email))
  
  if (adminUsers.includes(email)) {
    console.log('✅ User detected as Admin')
    return {
      userType: 'Admin',
      subscription: 'Admin'
    }
  }
  
  if (subscribedUsers.includes(email)) {
    console.log('✅ User detected as Subscriber')
    return {
      userType: 'Free', // Use 'Free' instead of 'Subscriber' to match enum
      subscription: 'Plus' // Default subscription for subscribed users
    }
  }
  
  console.log('❌ User detected as Free user')
  return {
    userType: 'Free',
    subscription: 'Free'
  }
}

export function getUserLimits(userType, subscription) {
  const limits = {
    'Free': { cards: 3, refreshes: 5 },
    'Plus': { cards: 5, refreshes: 8 },
    'Silver': { cards: 10, refreshes: 15 },
    'Gold': { cards: 15, refreshes: 25 },
    'Diamond': { cards: 25, refreshes: 40 },
    'Admin': { cards: -1, refreshes: -1 } // -1 means unlimited
  }
  
  if (userType === 'Admin') {
    return limits.Admin
  }
  
  return limits[subscription] || limits.Free
}