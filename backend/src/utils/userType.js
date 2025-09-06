import { getAdminUsers, getSubscribedUsers } from '../config/limits.js'

export function determineUserType(user) {
  const adminUsers = getAdminUsers()
  const subscribedUsers = getSubscribedUsers()
  
  const email = user.email?.toLowerCase()
  
  if (adminUsers.includes(email)) {
    return {
      userType: 'Admin',
      subscription: 'Admin'
    }
  }
  
  if (subscribedUsers.includes(email)) {
    return {
      userType: 'Subscriber',
      subscription: 'Plus' // Default subscription for subscribed users
    }
  }
  
  return {
    userType: 'Non Subscriber',
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