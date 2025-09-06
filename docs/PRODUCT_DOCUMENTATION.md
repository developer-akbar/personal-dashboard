# Personal Dashboard - Product Documentation

## 🎯 **Product Overview**
Personal Dashboard is a comprehensive web application that allows users to manage their Amazon accounts, track electricity bills, and monitor their financial data in one place.

## 🏗️ **Architecture**

### **Frontend (React + Vite)**
- **Framework**: React 18 with Vite
- **State Management**: Zustand
- **Routing**: React Router DOM
- **UI Components**: Custom CSS with CSS variables
- **Notifications**: React Hot Toast
- **Icons**: React Icons (Feather Icons)

### **Backend (Node.js + Express)**
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Access + Refresh tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Web Scraping**: Playwright (Amazon wallet balance)
- **Notifications**: Twilio SMS, Nodemailer SMTP

## 🔐 **Authentication System**

### **User Types**
- **Free**: 3 cards, 5 refreshes/day
- **Plus**: 5 cards, 8 refreshes/day
- **Silver**: 10 cards, 15 refreshes/day
- **Gold**: 15 cards, 25 refreshes/day
- **Diamond**: 25 cards, 40 refreshes/day
- **Admin**: Unlimited cards, unlimited refreshes

### **Authentication Flow**
1. **Registration**: Email, username, phone, password
2. **Login**: Email/username + password
3. **JWT Tokens**: Access (15min) + Refresh (7 days)
4. **Password Reset**: SMS OTP or Email link
5. **Session Management**: Automatic refresh, logout on expiry

## 📱 **Core Features**

### **Amazon Account Management**
- **Add Account**: Email + password (web scraping)
- **Balance Tracking**: Real-time wallet balance
- **Refresh Data**: Manual refresh with rate limiting
- **Account History**: Historical balance data
- **Multiple Accounts**: Support for multiple Amazon accounts

### **Electricity Bill Management**
- **Service Registration**: Service number + consumer name
- **Bill Tracking**: Current bill amount, due date, status
- **Payment History**: Track payment status and dates
- **Bill Breakdown**: Detailed bill components (energy, fixed, duty, etc.)
- **Multiple Services**: Support for multiple electricity services

### **User Profile Management**
- **Profile Editing**: Name, email, phone, avatar
- **Password Change**: Secure password update
- **Subscription Management**: View current plan, upgrade options
- **Account Settings**: Personal preferences

## 🎨 **UI/UX Features**

### **Responsive Design**
- **Mobile-First**: Optimized for mobile devices
- **Desktop Support**: Full desktop experience
- **Touch-Friendly**: Large touch targets, swipe gestures
- **Dark/Light Mode**: CSS variable-based theming

### **User Experience**
- **Loading States**: Skeleton loaders, progress indicators
- **Error Handling**: Graceful error messages, recovery actions
- **Connection Status**: Real-time connection monitoring
- **Toast Notifications**: User feedback and alerts
- **Modal Dialogs**: Profile editing, account management

## 🔧 **Technical Implementation**

### **API Endpoints**
```
Authentication:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

Amazon Accounts:
- GET /api/accounts
- POST /api/accounts
- PUT /api/accounts/:id
- DELETE /api/accounts/:id
- POST /api/balances/refresh/:accountId
- POST /api/balances/refresh-all

Electricity Services:
- GET /api/electricity
- POST /api/electricity
- PUT /api/electricity/:id
- DELETE /api/electricity/:id
- POST /api/electricity/refresh/:serviceId
- POST /api/electricity/refresh-all

User Management:
- GET /api/users/profile
- PUT /api/users/profile
- POST /api/users/change-password
```

### **Database Schema**
```javascript
// User Model
{
  name: String,
  email: String (unique),
  username: String (unique),
  phone: String,
  avatarUrl: String,
  passwordHash: String,
  userType: String (enum: Free, Plus, Silver, Gold, Diamond, Admin),
  subscription: String (enum: Free, Plus, Silver, Gold, Diamond, Admin),
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}

// Amazon Account Model
{
  userId: ObjectId,
  email: String,
  password: String (encrypted),
  isActive: Boolean,
  lastRefreshedAt: Date,
  createdAt: Date
}

// Balance Model
{
  accountId: ObjectId,
  amount: Number,
  currency: String,
  refreshedAt: Date
}

// Electricity Service Model
{
  userId: ObjectId,
  serviceNumber: String,
  consumerName: String,
  lastAmountDue: Number,
  lastDueDate: Date,
  lastStatus: String,
  lastFetchedAt: Date,
  isDeleted: Boolean
}
```

## 🧪 **Testing Scenarios**

### **Authentication Testing**
1. **Registration Flow**
   - Valid registration with all fields
   - Duplicate email/username handling
   - Invalid email format validation
   - Password strength validation
   - Mobile number validation (10-digit Indian)

2. **Login Flow**
   - Valid login with email
   - Valid login with username
   - Invalid credentials handling
   - Account lockout after multiple failures
   - Session expiration handling

3. **Password Reset**
   - SMS OTP flow (valid/invalid numbers)
   - Email reset link flow
   - OTP expiration handling
   - Invalid OTP handling

### **Amazon Account Management**
1. **Add Account**
   - Valid Amazon credentials
   - Invalid credentials handling
   - Duplicate account prevention
   - Web scraping success/failure

2. **Balance Refresh**
   - Single account refresh
   - Bulk refresh all accounts
   - Rate limiting enforcement
   - Error handling for failed refreshes

### **Electricity Bill Management**
1. **Service Registration**
   - Valid service number + consumer name
   - Duplicate service prevention
   - Invalid service number handling

2. **Bill Tracking**
   - Bill data fetching
   - Payment status determination
   - Bill breakdown display
   - Historical data tracking

### **User Profile Management**
1. **Profile Editing**
   - Update personal information
   - Avatar upload/change
   - Validation of updated fields

2. **Password Change**
   - Current password verification
   - New password validation
   - Confirmation matching

### **UI/UX Testing**
1. **Responsive Design**
   - Mobile viewport testing
   - Desktop viewport testing
   - Tablet viewport testing

2. **User Interactions**
   - Form submissions
   - Modal dialogs
   - Toast notifications
   - Loading states

3. **Error Handling**
   - Network error scenarios
   - Server error responses
   - Validation error display
   - Recovery actions

## 🚀 **Deployment**

### **Frontend (Vercel)**
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: `VITE_API_URL`

### **Backend (Render)**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**: MongoDB URI, JWT secrets, Twilio credentials

## 🔒 **Security Considerations**

### **Authentication Security**
- JWT token expiration
- Refresh token rotation
- Password hashing (bcrypt)
- Rate limiting on auth endpoints

### **Data Protection**
- Input validation and sanitization
- XSS prevention
- CSRF protection
- Secure cookie handling

### **API Security**
- Request rate limiting
- CORS configuration
- Helmet security headers
- Error message sanitization

## 📊 **Performance Considerations**

### **Frontend Optimization**
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

### **Backend Optimization**
- Database indexing
- Query optimization
- Caching strategies
- Connection pooling

## 🐛 **Common Issues & Solutions**

### **Connection Issues**
- Server cold start (inactivity)
- Network timeout handling
- Progressive error messages
- Automatic recovery actions

### **Data Synchronization**
- Duplicate data prevention
- Data cleanup strategies
- Upsert operations
- Historical data management

### **User Experience**
- Loading state management
- Error message clarity
- Recovery action suggestions
- Connection status indicators