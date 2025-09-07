import mongoose from 'mongoose';

const BillOptimizationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  strategyName: {
    type: String,
    required: true,
    trim: true
  },
  totalBills: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  totalWallets: {
    type: Number,
    required: true
  },
  totalWalletAmount: {
    type: Number,
    required: true
  },
  optimizationResult: {
    totalTransactions: {
      type: Number,
      required: true
    },
    totalFees: {
      type: Number,
      required: true
    },
    savings: {
      type: Number,
      required: true
    },
    strategies: [{
      walletId: {
        type: String,
        required: true
      },
      walletLabel: {
        type: String,
        required: true
      },
      walletAmount: {
        type: Number,
        required: true
      },
      bills: [{
        billId: {
          type: String,
          required: true
        },
        serviceNumber: {
          type: String,
          required: true
        },
        serviceLabel: {
          type: String,
          required: true
        },
        amount: {
          type: Number,
          required: true
        },
        dueDate: {
          type: Date,
          required: true
        }
      }],
      remainingAmount: {
        type: Number,
        required: true
      }
    }]
  },
  inputData: {
    bills: [{
      id: String,
      serviceNumber: String,
      serviceLabel: String,
      amount: Number,
      dueDate: Date,
      priority: String
    }],
    wallets: [{
      id: String,
      label: String,
      amount: Number,
      currency: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
BillOptimizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
BillOptimizationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('BillOptimization', BillOptimizationSchema);