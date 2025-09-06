# Personal Dashboard - Test Plan

## 🎯 **Test Strategy Overview**

### **Testing Approach**
- **Frontend Testing**: React component testing, user interaction testing, responsive design testing
- **Backend Testing**: API endpoint testing, database integration testing, authentication testing
- **Integration Testing**: End-to-end user flows, cross-browser compatibility
- **Performance Testing**: Load testing, response time testing, memory usage testing

## 🧪 **Test Execution Strategy**

### **Phase 1: Backend Testing (Recommended First)**
**Why Backend First?**
- ✅ **Foundation**: Backend provides API endpoints for frontend
- ✅ **Data Integrity**: Ensure database operations work correctly
- ✅ **Authentication**: Verify security and user management
- ✅ **API Contracts**: Ensure endpoints return expected data

**Backend Test Focus:**
1. **Authentication APIs** (`/api/auth/*`)
2. **User Management APIs** (`/api/users/*`)
3. **Amazon Account APIs** (`/api/accounts/*`, `/api/balances/*`)
4. **Electricity Service APIs** (`/api/electricity/*`)
5. **Database Operations** (MongoDB integration)
6. **Security Testing** (JWT, rate limiting, validation)

### **Phase 2: Frontend Testing (After Backend)**
**Why Frontend Second?**
- ✅ **Dependencies**: Frontend depends on backend APIs
- ✅ **User Experience**: Test actual user interactions
- ✅ **UI Components**: Verify component rendering and behavior
- ✅ **Integration**: Test frontend-backend communication

**Frontend Test Focus:**
1. **Component Rendering** (React components)
2. **User Interactions** (forms, buttons, modals)
3. **State Management** (Zustand store)
4. **Routing** (React Router navigation)
5. **Responsive Design** (mobile, tablet, desktop)
6. **Error Handling** (user feedback, recovery actions)

## 📋 **Detailed Test Scenarios**

### **Backend Testing Scenarios**

#### **1. Authentication Testing**
```javascript
// Test Cases:
- POST /api/auth/register
  - Valid registration data
  - Duplicate email handling
  - Invalid email format
  - Password validation
  - Mobile number validation

- POST /api/auth/login
  - Valid login credentials
  - Invalid credentials
  - Account lockout
  - JWT token generation

- POST /api/auth/forgot-password
  - Valid mobile number
  - Invalid mobile number
  - SMS OTP generation
  - OTP expiration handling

- POST /api/auth/reset-password
  - Valid OTP and new password
  - Invalid OTP
  - Expired OTP
  - Password strength validation
```

#### **2. User Management Testing**
```javascript
// Test Cases:
- GET /api/users/profile
  - Authenticated user access
  - Unauthenticated access (401)
  - Profile data accuracy

- PUT /api/users/profile
  - Valid profile updates
  - Invalid data validation
  - Field-specific validation

- POST /api/users/change-password
  - Valid current password
  - Invalid current password
  - New password validation
  - Password confirmation matching
```

#### **3. Amazon Account Management Testing**
```javascript
// Test Cases:
- POST /api/accounts
  - Valid Amazon credentials
  - Invalid credentials
  - Duplicate account prevention
  - Web scraping success/failure

- GET /api/accounts
  - User's accounts retrieval
  - Pagination (if implemented)
  - Data accuracy

- POST /api/balances/refresh/:accountId
  - Single account refresh
  - Rate limiting enforcement
  - Error handling
  - Database update verification

- POST /api/balances/refresh-all
  - Bulk refresh functionality
  - Partial success handling
  - Performance testing
```

#### **4. Electricity Service Management Testing**
```javascript
// Test Cases:
- POST /api/electricity
  - Valid service registration
  - Duplicate service prevention
  - Invalid service number
  - Consumer name validation

- GET /api/electricity
  - User's services retrieval
  - Data accuracy
  - Filtering and sorting

- POST /api/electricity/refresh/:serviceId
  - Service refresh functionality
  - Bill data accuracy
  - Payment status determination
  - Error handling
```

### **Frontend Testing Scenarios**

#### **1. Component Testing**
```javascript
// Test Cases:
- Login Component
  - Form rendering
  - Input validation
  - Submit handling
  - Error display

- Registration Component
  - Form rendering
  - Field validation
  - Password strength indicator
  - Success/error handling

- Profile Component
  - User data display
  - Edit modal functionality
  - Form validation
  - Save/cancel actions

- Dashboard Components
  - Data display
  - Refresh functionality
  - Loading states
  - Error handling
```

#### **2. User Interaction Testing**
```javascript
// Test Cases:
- Form Submissions
  - Login form
  - Registration form
  - Profile edit form
  - Password change form

- Modal Interactions
  - Profile edit modal
  - Add account modal
  - Add service modal
  - Upgrade plan modal

- Button Interactions
  - Refresh buttons
  - Delete buttons
  - Save buttons
  - Cancel buttons

- Navigation
  - Route changes
  - Back/forward navigation
  - Deep linking
  - Protected routes
```

#### **3. Responsive Design Testing**
```javascript
// Test Cases:
- Mobile Viewport (375px)
  - Layout adaptation
  - Touch targets
  - Form usability
  - Navigation menu

- Tablet Viewport (768px)
  - Layout adaptation
  - Grid system
  - Component sizing
  - Touch interactions

- Desktop Viewport (1920px)
  - Full layout
  - Hover effects
  - Keyboard navigation
  - Multi-column layouts
```

## 🔧 **Test Configuration**

### **Backend Test Setup**
```bash
# Environment Variables
MONGODB_URI=mongodb://localhost:27017/personal-dashboard-test
JWT_SECRET=test-secret-key
JWT_REFRESH_SECRET=test-refresh-secret
NODE_ENV=test

# Test Commands
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### **Frontend Test Setup**
```bash
# Environment Variables
VITE_API_URL=http://localhost:4000

# Test Commands
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

## 📊 **Test Data Management**

### **Test Users**
```javascript
const testUsers = [
  {
    name: "Test User",
    email: "test@example.com",
    username: "testuser",
    phone: "9876543210",
    password: "TestPassword123!",
    userType: "Free",
    subscription: "Free"
  },
  {
    name: "Admin User",
    email: "admin@example.com",
    username: "admin",
    phone: "9876543211",
    password: "AdminPassword123!",
    userType: "Admin",
    subscription: "Admin"
  }
];
```

### **Test Amazon Accounts**
```javascript
const testAmazonAccounts = [
  {
    email: "test@amazon.com",
    password: "TestPassword123!"
  }
];
```

### **Test Electricity Services**
```javascript
const testElectricityServices = [
  {
    serviceNumber: "1234567890",
    consumerName: "Test Consumer"
  }
];
```

## 🚀 **Test Execution Steps**

### **Step 1: Backend Testing**
1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Run Backend Tests**
   ```bash
   npm run test
   ```

3. **Verify API Endpoints**
   - Test all authentication endpoints
   - Test user management endpoints
   - Test Amazon account endpoints
   - Test electricity service endpoints

### **Step 2: Frontend Testing**
1. **Start Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Run Frontend Tests**
   ```bash
   npm run test
   ```

3. **Verify UI Components**
   - Test all React components
   - Test user interactions
   - Test responsive design
   - Test error handling

### **Step 3: Integration Testing**
1. **Start Both Servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Test End-to-End Flows**
   - User registration → login → dashboard
   - Add Amazon account → refresh balance
   - Add electricity service → refresh bill
   - Profile editing → password change

## 📈 **Success Criteria**

### **Backend Testing Success**
- ✅ All API endpoints return expected responses
- ✅ Database operations work correctly
- ✅ Authentication and authorization work
- ✅ Error handling is proper
- ✅ Rate limiting is enforced
- ✅ Data validation is working

### **Frontend Testing Success**
- ✅ All components render correctly
- ✅ User interactions work as expected
- ✅ Responsive design works on all devices
- ✅ Error handling provides good UX
- ✅ Loading states are shown appropriately
- ✅ Navigation works correctly

### **Integration Testing Success**
- ✅ Frontend and backend communicate correctly
- ✅ End-to-end user flows work
- ✅ Data synchronization is accurate
- ✅ Error propagation works correctly
- ✅ Performance is acceptable

## 🐛 **Common Issues to Test**

### **Backend Issues**
- Database connection failures
- Invalid JWT tokens
- Rate limiting exceeded
- Validation errors
- Server errors (500)

### **Frontend Issues**
- Network connectivity problems
- API timeout errors
- Form validation errors
- Component rendering errors
- State management issues

### **Integration Issues**
- API endpoint changes
- Data format mismatches
- Authentication token expiration
- CORS issues
- Network latency

## 📝 **Test Reporting**

### **Test Results Format**
- **Test Case Name**: Clear description
- **Status**: Pass/Fail/Skip
- **Duration**: Time taken
- **Error Details**: If failed
- **Screenshots**: For UI tests
- **Logs**: For debugging

### **Coverage Reports**
- **Backend**: API endpoint coverage
- **Frontend**: Component coverage
- **Integration**: User flow coverage
- **Overall**: Total test coverage percentage

This test plan provides a comprehensive approach to testing your Personal Dashboard application using TestSprite MCP. Start with backend testing to ensure the foundation is solid, then move to frontend testing to verify the user experience.