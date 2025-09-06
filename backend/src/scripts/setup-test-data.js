import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import AmazonAccount from '../models/AmazonAccount.js';
import ElectricityService from '../models/ElectricityService.js';

// Load environment variables
dotenv.config();

async function setupTestData() {
  try {
    console.log('🚀 Setting up test data...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/personal-dashboard-test';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Create test users
    const testUsers = [
      {
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        phone: '9876543210',
        passwordHash: await bcrypt.hash('TestPassword123!', 12),
        userType: 'Free',
        subscription: 'Free',
        avatarUrl: ''
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        username: 'admin',
        phone: '9876543211',
        passwordHash: await bcrypt.hash('AdminPassword123!', 12),
        userType: 'Admin',
        subscription: 'Admin',
        avatarUrl: ''
      },
      {
        name: 'Subscriber User',
        email: 'subscriber@example.com',
        username: 'subscriber',
        phone: '9876543212',
        passwordHash: await bcrypt.hash('SubscriberPassword123!', 12),
        userType: 'Free',
        subscription: 'Plus',
        avatarUrl: ''
      }
    ];

    console.log('👥 Creating test users...');
    for (const userData of testUsers) {
      const user = await User.findOneAndUpdate(
        { email: userData.email },
        userData,
        { upsert: true, new: true }
      );
      console.log(`✅ User created/updated: ${user.email} (${user.userType})`);
    }

    // Create test Amazon accounts
    console.log('📱 Creating test Amazon accounts...');
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      const amazonAccounts = [
        {
          userId: testUser._id,
          email: 'test@amazon.com',
          password: 'encrypted_password_1',
          isActive: true,
          lastRefreshedAt: new Date()
        },
        {
          userId: testUser._id,
          email: 'test2@amazon.com',
          password: 'encrypted_password_2',
          isActive: true,
          lastRefreshedAt: new Date()
        }
      ];

      for (const accountData of amazonAccounts) {
        await AmazonAccount.findOneAndUpdate(
          { userId: accountData.userId, email: accountData.email },
          accountData,
          { upsert: true, new: true }
        );
        console.log(`✅ Amazon account created: ${accountData.email}`);
      }
    }

    // Create test electricity services
    console.log('⚡ Creating test electricity services...');
    if (testUser) {
      const electricityServices = [
        {
          userId: testUser._id,
          serviceNumber: '1234567890',
          consumerName: 'Test Consumer 1',
          lastAmountDue: 1500.50,
          lastDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          lastStatus: 'Pending',
          lastFetchedAt: new Date(),
          isDeleted: false
        },
        {
          userId: testUser._id,
          serviceNumber: '0987654321',
          consumerName: 'Test Consumer 2',
          lastAmountDue: 2200.75,
          lastDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          lastStatus: 'Paid',
          lastFetchedAt: new Date(),
          isDeleted: false
        }
      ];

      for (const serviceData of electricityServices) {
        await ElectricityService.findOneAndUpdate(
          { userId: serviceData.userId, serviceNumber: serviceData.serviceNumber },
          serviceData,
          { upsert: true, new: true }
        );
        console.log(`✅ Electricity service created: ${serviceData.serviceNumber}`);
      }
    }

    // Show summary
    console.log('\n📊 Test Data Summary:');
    const userCount = await User.countDocuments();
    const accountCount = await AmazonAccount.countDocuments();
    const serviceCount = await ElectricityService.countDocuments();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`📱 Amazon Accounts: ${accountCount}`);
    console.log(`⚡ Electricity Services: ${serviceCount}`);

    console.log('\n✅ Test data setup complete!');
    console.log('\n🧪 Test Credentials:');
    console.log('Email: test@example.com, Password: TestPassword123!');
    console.log('Email: admin@example.com, Password: AdminPassword123!');
    console.log('Email: subscriber@example.com, Password: SubscriberPassword123!');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the setup
setupTestData();