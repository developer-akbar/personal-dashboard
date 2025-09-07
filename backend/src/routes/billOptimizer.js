import { Router } from "express";
import BillOptimization from "../models/BillOptimization.js";
import ElectricityService from "../models/ElectricityService.js";
import AmazonAccount from "../models/AmazonAccount.js";
import Balance from "../models/Balance.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { optimizeBillPayments, optimizeMinimizeLeftover, calculateOptimizationMetrics } from "../utils/billOptimizer.js";

const router = Router();

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.userType !== 'Admin' && user.subscription !== 'Admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

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
    message: "Bill Optimizer API is working", 
    timestamp: new Date().toISOString(),
    routes: [
      "GET /unpaid-bills",
      "GET /wallet-amounts", 
      "POST /optimize",
      "GET /strategies",
      "GET /strategies/:id",
      "POST /strategies/:id/recalculate",
      "DELETE /strategies/:id"
    ]
  });
});

// Apply middleware
router.use(authenticateToken);
router.use(requireAdmin);

// Get unpaid bills from electricity services for logged-in user
router.get("/unpaid-bills", async (req, res, next) => {
  try {
    const userId = req.user.sub;
    
    const unpaidBills = await ElectricityService.find({
      userId: userId,
      lastStatus: 'DUE',
      lastAmountDue: { $gt: 0 },
      isDeleted: { $ne: true }
    }).select('serviceNumber label lastAmountDue lastDueDate lastBillDate');

    const bills = unpaidBills.map(bill => ({
      id: bill._id.toString(),
      serviceNumber: bill.serviceNumber,
      serviceLabel: bill.label || `Service ${bill.serviceNumber}`,
      amount: bill.lastAmountDue || 0,
      dueDate: bill.lastDueDate || bill.lastBillDate,
      priority: getBillPriority(bill.lastDueDate)
    }));

    res.json({ bills });
  } catch (error) {
    console.error('Get unpaid bills error:', error);
    next(error);
  }
});

// Get wallet amounts from Amazon accounts for logged-in user
router.get("/wallet-amounts", async (req, res, next) => {
  try {
    const userId = req.user.sub;
    
    const amazonAccounts = await AmazonAccount.find({
      userId: userId,
      isDeleted: { $ne: true }
    }).select('label email lastBalance lastCurrency');

    const wallets = amazonAccounts.map(account => ({
      id: account._id.toString(),
      label: account.label || account.email,
      amount: account.lastBalance || 0,
      currency: account.lastCurrency || 'INR'
    }));

    res.json({ wallets });
  } catch (error) {
    console.error('Get wallet amounts error:', error);
    next(error);
  }
});

// Optimize bill payments
router.post("/optimize", async (req, res, next) => {
  try {
    const { bills, wallets, strategy = 'default', strategyName } = req.body;
    const userId = req.user.sub;

    if (!bills || !wallets || !Array.isArray(bills) || !Array.isArray(wallets)) {
      return res.status(400).json({ error: "Bills and wallets arrays are required" });
    }

    if (bills.length === 0 || wallets.length === 0) {
      return res.status(400).json({ error: "At least one bill and one wallet required" });
    }

    // Choose optimization strategy
    let optimizationResult;
    if (strategy === 'minimize-leftover') {
      optimizationResult = optimizeMinimizeLeftover(bills, wallets);
    } else {
      optimizationResult = optimizeBillPayments(bills, wallets);
    }

    // Calculate additional metrics
    const metrics = calculateOptimizationMetrics(bills, wallets, optimizationResult.strategies);

    // Create optimization record
    const optimization = new BillOptimization({
      userId,
      strategyName: strategyName || `Optimization ${new Date().toLocaleString()}`,
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
      totalWallets: wallets.length,
      totalWalletAmount: wallets.reduce((sum, wallet) => sum + wallet.amount, 0),
      optimizationResult,
      inputData: { bills, wallets }
    });

    await optimization.save();

    res.json({
      success: true,
      optimizationId: optimization._id,
      strategyName: optimization.strategyName,
      metrics,
      result: optimizationResult
    });
  } catch (error) {
    console.error('Optimize bills error:', error);
    next(error);
  }
});

// Get saved optimizations
router.get("/strategies", async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const { page = 1, limit = 10 } = req.query;

    const strategies = await BillOptimization.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('strategyName totalBills totalAmount totalWallets totalWalletAmount optimizationResult createdAt updatedAt');

    const total = await BillOptimization.countDocuments({ userId });

    res.json({
      strategies,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get strategies error:', error);
    next(error);
  }
});

// Get specific optimization details
router.get("/strategies/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    console.log('🔍 Getting strategy details:', { id, userId });

    const strategy = await BillOptimization.findOne({ _id: id, userId });
    if (!strategy) {
      console.log('❌ Strategy not found:', { id, userId });
      return res.status(404).json({ error: "Strategy not found" });
    }

    console.log('✅ Strategy found:', strategy._id);
    res.json({ strategy });
  } catch (error) {
    console.error('Get strategy details error:', error);
    next(error);
  }
});

// Recalculate optimization
router.post("/strategies/:id/recalculate", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const { strategy = 'default' } = req.body;

    const existingStrategy = await BillOptimization.findOne({ _id: id, userId });
    if (!existingStrategy) {
      return res.status(404).json({ error: "Strategy not found" });
    }

    const { bills, wallets } = existingStrategy.inputData;

    // Recalculate with new strategy
    let optimizationResult;
    if (strategy === 'minimize-leftover') {
      optimizationResult = optimizeMinimizeLeftover(bills, wallets);
    } else {
      optimizationResult = optimizeBillPayments(bills, wallets);
    }

    // Update the strategy
    existingStrategy.optimizationResult = optimizationResult;
    existingStrategy.updatedAt = new Date();
    await existingStrategy.save();

    const metrics = calculateOptimizationMetrics(bills, wallets, optimizationResult.strategies);

    res.json({
      success: true,
      metrics,
      result: optimizationResult
    });
  } catch (error) {
    console.error('Recalculate strategy error:', error);
    next(error);
  }
});

// Delete optimization strategy
router.delete("/strategies/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const strategy = await BillOptimization.findOneAndDelete({ _id: id, userId });
    if (!strategy) {
      return res.status(404).json({ error: "Strategy not found" });
    }

    res.json({ success: true, message: "Strategy deleted successfully" });
  } catch (error) {
    console.error('Delete strategy error:', error);
    next(error);
  }
});

// Get optimization statistics
router.get("/stats", async (req, res, next) => {
  try {
    const userId = req.user.sub;

    const stats = await BillOptimization.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalStrategies: { $sum: 1 },
          totalSavings: { $sum: "$optimizationResult.savings" },
          avgTransactions: { $avg: "$optimizationResult.totalTransactions" },
          avgSavings: { $avg: "$optimizationResult.savings" }
        }
      }
    ]);

    const result = stats[0] || {
      totalStrategies: 0,
      totalSavings: 0,
      avgTransactions: 0,
      avgSavings: 0
    };

    res.json({ stats: result });
  } catch (error) {
    console.error('Get optimization stats error:', error);
    next(error);
  }
});

// Helper function to determine bill priority
function getBillPriority(dueDate) {
  if (!dueDate) return 'unknown';
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'urgent';
  if (diffDays <= 7) return 'high';
  if (diffDays <= 15) return 'medium';
  return 'low';
}

export default router;