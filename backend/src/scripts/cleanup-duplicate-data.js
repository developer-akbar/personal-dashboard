import mongoose from 'mongoose';
import Balance from '../models/Balance.js';
import ElectricityService from '../models/ElectricityService.js';
import AmazonAccount from '../models/AmazonAccount.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log("❌ MONGODB_URI not set, skipping database connection");
      return false;
    }

    mongoose.set("strictQuery", true);
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || "personal_dashboard",
    });
    console.log("✅ Connected to MongoDB");
    return true;
  } catch (error) {
    console.log("❌ Failed to connect to MongoDB:", error.message);
    return false;
  }
}

async function cleanupDuplicateBalances() {
  console.log("\n🧹 Cleaning up duplicate balance data...");
  
  try {
    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users`);

    let totalDeleted = 0;
    let totalKept = 0;

    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.email}`);
      
      // Get all Amazon accounts for this user
      const accounts = await AmazonAccount.find({ userId: user._id });
      console.log(`  📱 Found ${accounts.length} Amazon accounts`);

      for (const account of accounts) {
        // Get all balance records for this account
        const balances = await Balance.find({ accountId: account._id })
          .sort({ createdAt: -1 }); // Most recent first

        if (balances.length > 1) {
          console.log(`    💰 Account ${account.email}: ${balances.length} balance records found`);
          
          // Keep the most recent one
          const latestBalance = balances[0];
          const oldBalances = balances.slice(1);
          
          // Delete old balances
          const deleteResult = await Balance.deleteMany({
            _id: { $in: oldBalances.map(b => b._id) }
          });
          
          totalDeleted += deleteResult.deletedCount;
          totalKept += 1;
          
          console.log(`    ✅ Kept latest balance (${latestBalance.amount} ${latestBalance.currency}), deleted ${deleteResult.deletedCount} old records`);
        } else if (balances.length === 1) {
          totalKept += 1;
          console.log(`    ✅ Account ${account.email}: Only 1 balance record (no cleanup needed)`);
        } else {
          console.log(`    ℹ️  Account ${account.email}: No balance records found`);
        }
      }
    }

    console.log(`\n📊 Balance cleanup summary:`);
    console.log(`  ✅ Kept: ${totalKept} latest balance records`);
    console.log(`  🗑️  Deleted: ${totalDeleted} old balance records`);
    
    return { kept: totalKept, deleted: totalDeleted };
  } catch (error) {
    console.error("❌ Error cleaning up balance data:", error);
    throw error;
  }
}

async function cleanupDuplicateElectricityServices() {
  console.log("\n🧹 Analyzing electricity service data...");
  
  try {
    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users`);

    let totalProcessed = 0;
    let totalWithData = 0;
    let totalWithoutData = 0;

    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.email}`);
      
      // Get all electricity services for this user
      const services = await ElectricityService.find({ 
        userId: user._id,
        isDeleted: { $ne: true }
      });
      
      console.log(`  ⚡ Found ${services.length} electricity services`);

      for (const service of services) {
        const hasData = service.lastFetchedAt && service.lastAmountDue !== undefined;
        
        if (hasData) {
          totalWithData++;
          console.log(`    ✅ Service ${service.serviceNumber}: Has data (Last: ${service.lastFetchedAt}, Amount: ${service.lastAmountDue}, Status: ${service.lastStatus})`);
        } else {
          totalWithoutData++;
          console.log(`    ⚠️  Service ${service.serviceNumber}: No refresh data yet`);
        }
        
        totalProcessed++;
      }
    }

    console.log(`\n📊 Electricity services analysis:`);
    console.log(`  ✅ Total services: ${totalProcessed}`);
    console.log(`  📊 Services with data: ${totalWithData}`);
    console.log(`  ⚠️  Services without data: ${totalWithoutData}`);
    console.log(`  ℹ️  Note: Electricity services use single document per service (already optimized)`);
    console.log(`  ℹ️  No cleanup needed - they update existing documents on refresh`);
    
    return { processed: totalProcessed, withData: totalWithData, withoutData: totalWithoutData };
  } catch (error) {
    console.error("❌ Error analyzing electricity services:", error);
    throw error;
  }
}

async function showDataSummary() {
  console.log("\n📊 Current data summary:");
  
  try {
    const userCount = await User.countDocuments();
    const accountCount = await AmazonAccount.countDocuments();
    const balanceCount = await Balance.countDocuments();
    const electricityCount = await ElectricityService.countDocuments({ isDeleted: { $ne: true } });
    
    console.log(`  👥 Users: ${userCount}`);
    console.log(`  📱 Amazon accounts: ${accountCount}`);
    console.log(`  💰 Balance records: ${balanceCount}`);
    console.log(`  ⚡ Electricity services: ${electricityCount}`);
    
    // Show balance distribution per account
    const balanceStats = await Balance.aggregate([
      {
        $group: {
          _id: "$accountId",
          count: { $sum: 1 },
          latestAmount: { $max: "$amount" },
          latestCurrency: { $first: "$currency" }
        }
      },
      {
        $group: {
          _id: null,
          totalAccounts: { $sum: 1 },
          accountsWithMultipleBalances: { $sum: { $cond: [{ $gt: ["$count", 1] }, 1, 0] } },
          maxBalancesPerAccount: { $max: "$count" }
        }
      }
    ]);
    
    if (balanceStats.length > 0) {
      const stats = balanceStats[0];
      console.log(`\n💰 Balance data analysis:`);
      console.log(`  📱 Total accounts with balance data: ${stats.totalAccounts}`);
      console.log(`  🔄 Accounts with multiple balance records: ${stats.accountsWithMultipleBalances}`);
      console.log(`  📈 Max balance records per account: ${stats.maxBalancesPerAccount}`);
    }
    
    // Show electricity service statistics
    const electricityStats = await ElectricityService.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          servicesWithData: { $sum: { $cond: [{ $ne: ["$lastFetchedAt", null] }, 1, 0] } },
          servicesWithoutData: { $sum: { $cond: [{ $eq: ["$lastFetchedAt", null] }, 1, 0] } }
        }
      }
    ]);
    
    if (electricityStats.length > 0) {
      const stats = electricityStats[0];
      console.log(`\n⚡ Electricity services analysis:`);
      console.log(`  📊 Total services: ${stats.totalServices}`);
      console.log(`  ✅ Services with refresh data: ${stats.servicesWithData}`);
      console.log(`  ⚠️  Services without refresh data: ${stats.servicesWithoutData}`);
      console.log(`  ℹ️  Note: Each service uses single document (already optimized)`);
    }
    
  } catch (error) {
    console.error("❌ Error getting data summary:", error);
  }
}

async function main() {
  console.log("🚀 Starting data cleanup migration...");
  console.log("This will remove duplicate balance data and keep only the latest records.");
  
  const connected = await connectToDatabase();
  if (!connected) {
    console.log("❌ Cannot proceed without database connection");
    process.exit(1);
  }

  try {
    // Show current data summary
    await showDataSummary();
    
    // Clean up duplicate balances
    const balanceResult = await cleanupDuplicateBalances();
    
    // Analyze electricity services (already optimized)
    const electricityResult = await cleanupDuplicateElectricityServices();
    
    // Show final summary
    console.log("\n🎉 Cleanup completed successfully!");
    console.log(`📊 Final results:`);
    console.log(`  💰 Balance records: Kept ${balanceResult.kept}, Deleted ${balanceResult.deleted}`);
    console.log(`  ⚡ Electricity services: ${electricityResult.processed} total, ${electricityResult.withData} with data, ${electricityResult.withoutData} without data`);
    
    console.log("\n✅ Migration completed! Your database is now optimized.");
    console.log("🔄 Future refreshes will update existing records instead of creating new ones.");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from database");
  }
}

// Run the migration
main().catch(console.error);