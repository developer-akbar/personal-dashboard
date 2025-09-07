import mongoose from 'mongoose';
import User from '../models/User.js';
import { determineUserType } from '../utils/userType.js';

async function fixAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personal-dashboard');
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users`);

    let updatedCount = 0;
    
    for (const user of users) {
      const { userType, subscription } = determineUserType(user);
      
      console.log(`👤 Checking user: ${user.email}`);
      console.log(`   Current: userType=${user.userType}, subscription=${user.subscription}`);
      console.log(`   Should be: userType=${userType}, subscription=${subscription}`);
      
      if (user.userType !== userType || user.subscription !== subscription) {
        console.log(`🔄 Updating user ${user.email}: ${user.userType}/${user.subscription} -> ${userType}/${subscription}`);
        user.userType = userType;
        user.subscription = subscription;
        await user.save();
        updatedCount++;
        console.log(`✅ Updated user ${user.email}`);
      } else {
        console.log(`✅ User ${user.email} is already correct`);
      }
    }
    
    console.log(`\n🎉 Fix completed! Updated ${updatedCount} users`);
    
    // Show final status
    const adminUsers = await User.find({ 
      $or: [{ userType: 'Admin' }, { subscription: 'Admin' }] 
    });
    console.log(`\n👑 Admin users found: ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.userType}/${user.subscription})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing admin users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixAdminUser();