import { Router } from "express";
import User from "../models/User.js";
import AmazonAccount from "../models/AmazonAccount.js";
import ElectricityService from "../models/ElectricityService.js";
import Balance from "../models/Balance.js";

const router = Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    console.log('🔍 Admin middleware check:', { userId, user: req.user });
    
    if (!userId) {
      console.log('❌ No user ID in request');
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({ error: "User not found" });
    }

    console.log('👤 User found:', { 
      id: user._id, 
      email: user.email, 
      userType: user.userType, 
      subscription: user.subscription 
    });

    if (user.userType !== 'Admin' && user.subscription !== 'Admin') {
      console.log('❌ User is not admin');
      return res.status(403).json({ error: "Admin access required" });
    }

    console.log('✅ Admin access granted');
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Test endpoint (no auth required for debugging)
router.get("/test", (req, res) => {
  res.json({ 
    message: "Admin routes are working", 
    timestamp: new Date().toISOString(),
    user: req.user || null
  });
});

// Apply admin middleware to all routes except test
router.use((req, res, next) => {
  if (req.path === '/test') {
    return next();
  }
  return requireAdmin(req, res, next);
});

// Get analytics data
router.get("/analytics", async (req, res, next) => {
  try {
    // Get all users with their account counts
    const users = await User.find({}, {
      name: 1,
      email: 1,
      phone: 1,
      userType: 1,
      subscription: 1,
      createdAt: 1,
      lastActive: 1,
      active: 1
    }).sort({ createdAt: -1 });

    // Get user type distribution
    const userTypes = {};
    users.forEach(user => {
      const type = user.userType || 'Free';
      userTypes[type] = (userTypes[type] || 0) + 1;
    });

    // Get account counts for each user
    const usersWithCounts = await Promise.all(users.map(async (user) => {
      const amazonCount = await AmazonAccount.countDocuments({ userId: user._id });
      const electricityCount = await ElectricityService.countDocuments({ 
        userId: user._id, 
        isDeleted: { $ne: true } 
      });
      
      return {
        ...user.toObject(),
        amazonAccounts: amazonCount,
        electricityServices: electricityCount
      };
    }));

    // Get total counts
    const totalUsers = users.length;
    const totalAmazonAccounts = await AmazonAccount.countDocuments();
    const totalElectricityServices = await ElectricityService.countDocuments({ 
      isDeleted: { $ne: true } 
    });

    // Get total refreshes (approximate from balance records)
    const totalRefreshes = await Balance.countDocuments();

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.find({
      lastActive: { $gte: sevenDaysAgo }
    }).sort({ lastActive: -1 }).limit(10);

    res.json({
      users: usersWithCounts,
      totalUsers,
      userTypes,
      amazonAccounts: totalAmazonAccounts,
      electricityServices: totalElectricityServices,
      totalRefreshes,
      recentActivity: recentUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        lastActive: user.lastActive,
        userType: user.userType
      }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    next(error);
  }
});

// Get user details
router.get("/users/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's accounts
    const amazonAccounts = await AmazonAccount.find({ userId });
    const electricityServices = await ElectricityService.find({ 
      userId, 
      isDeleted: { $ne: true } 
    });

    res.json({
      ...user.toObject(),
      amazonAccounts: amazonAccounts.length,
      electricityServices: electricityServices.length,
      amazonAccountsList: amazonAccounts,
      electricityServicesList: electricityServices
    });
  } catch (error) {
    console.error('Get user error:', error);
    next(error);
  }
});

// Toggle user status (activate/deactivate)
router.post("/users/:userId/toggle-status", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { active } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.active = active !== undefined ? active : !user.active;
    await user.save();

    res.json({ 
      success: true, 
      message: `User ${user.active ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        active: user.active
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    next(error);
  }
});

// Reset user limits
router.post("/users/:userId/reset-limits", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Reset refresh counts (if you have daily refresh tracking)
    // This is a placeholder - implement based on your refresh tracking system
    user.dailyRefreshes = 0;
    user.lastRefreshReset = new Date();
    await user.save();

    res.json({ 
      success: true, 
      message: "User limits reset successfully",
      user: {
        id: user._id,
        email: user.email,
        dailyRefreshes: user.dailyRefreshes
      }
    });
  } catch (error) {
    console.error('Reset limits error:', error);
    next(error);
  }
});

// Update user type/subscription
router.post("/users/:userId/update-type", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { userType, subscription } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userType) user.userType = userType;
    if (subscription) user.subscription = subscription;
    
    await user.save();

    res.json({ 
      success: true, 
      message: "User type updated successfully",
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Update user type error:', error);
    next(error);
  }
});

// Delete user (soft delete)
router.delete("/users/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Soft delete - mark as deleted
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.json({ 
      success: true, 
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
});

// Get system statistics
router.get("/stats", async (req, res, next) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments({ isDeleted: { $ne: true } }),
      activeUsers: await User.countDocuments({ active: true, isDeleted: { $ne: true } }),
      adminUsers: await User.countDocuments({ 
        $or: [{ userType: 'Admin' }, { subscription: 'Admin' }],
        isDeleted: { $ne: true }
      }),
      totalAmazonAccounts: await AmazonAccount.countDocuments(),
      totalElectricityServices: await ElectricityService.countDocuments({ 
        isDeleted: { $ne: true } 
      }),
      totalRefreshes: await Balance.countDocuments(),
      recentRegistrations: await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    next(error);
  }
});

// Manual admin update endpoint (for fixing existing users)
router.post("/fix-admin-users", async (req, res, next) => {
  try {
    const { determineUserType } = await import('../utils/userType.js');
    
    // Get all users
    const users = await User.find({});
    let updatedCount = 0;
    
    for (const user of users) {
      const { userType, subscription } = determineUserType(user);
      
      if (user.userType !== userType || user.subscription !== subscription) {
        console.log(`🔄 Updating user ${user.email}: ${user.userType}/${user.subscription} -> ${userType}/${subscription}`);
        user.userType = userType;
        user.subscription = subscription;
        await user.save();
        updatedCount++;
      }
    }
    
    res.json({ 
      success: true, 
      message: `Updated ${updatedCount} users`,
      updatedCount 
    });
  } catch (error) {
    console.error('Fix admin users error:', error);
    next(error);
  }
});

export default router;