# MSG91 Setup Guide for Personal Dashboard

## 🎯 **What is MSG91?**

MSG91 is an Indian SMS service provider that offers:
- ✅ **Better rates** for Indian mobile numbers
- ✅ **No trial account limitations** (unlike Twilio)
- ✅ **Direct SMS to Indian numbers** without verification
- ✅ **Reliable delivery** in India
- ✅ **Easy integration** with REST APIs

## 🚀 **Step-by-Step Setup**

### **1. Create MSG91 Account**

#### **Account Registration:**
1. **Visit:** [https://msg91.com](https://msg91.com)
2. **Click** "Sign Up" or "Get Started"
3. **Fill in** your details:
   - Name, Email, Phone
   - Company name (optional)
   - Country: India
4. **Verify** your email address
5. **Complete** profile setup

#### **Account Verification:**
1. **Upload** KYC documents (if required)
2. **Wait** for account approval (usually instant)
3. **Check** your email for confirmation

### **2. Get API Credentials**

#### **Access Dashboard:**
1. **Login** to [MSG91 Dashboard](https://control.msg91.com)
2. **Navigate** to "API" section
3. **Copy** your credentials:

#### **Required Credentials:**
```bash
# Primary credentials
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=PERSDB
MSG91_ROUTE=4

# Optional (for advanced features)
MSG91_FLOW_ID=your_flow_id_here
```

### **3. Configure Environment Variables**

#### **For Render (Production):**
1. **Go to** your Render dashboard
2. **Select** your backend service
3. **Go to** "Environment" tab
4. **Add** these variables:

```bash
# MSG91 Configuration
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=PERSDB
MSG91_ROUTE=4

# Keep existing Twilio (as fallback)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

#### **For Local Development:**
1. **Open** `backend/.env` file
2. **Add** MSG91 variables:

```bash
# MSG91 Configuration
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=PERSDB
MSG91_ROUTE=4

# Existing variables
MONGODB_URI=mongodb://localhost:27017/personal-dashboard
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### **4. Test MSG91 Integration**

#### **Test SMS Endpoint:**
```bash
# Test via curl
curl -X POST https://your-backend-url.com/api/auth/test-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "message": "Test SMS from Personal Dashboard"
  }'
```

#### **Expected Response:**
```json
{
  "success": true,
  "message": "SMS test completed",
  "inputNumber": "9876543210",
  "result": {
    "success": true,
    "messageId": "MSG91_SENT"
  }
}
```

## 🔧 **MSG91 Configuration Details**

### **Environment Variables Explained:**

#### **MSG91_AUTH_KEY**
- **What:** Your MSG91 API authentication key
- **Where to find:** MSG91 Dashboard → API → Auth Key
- **Format:** String (e.g., "1234567890abcdef")
- **Required:** Yes

#### **MSG91_SENDER_ID**
- **What:** Sender ID for your SMS (max 6 characters)
- **Format:** String (e.g., "PERSDB", "DASHBD")
- **Required:** Yes
- **Note:** Must be approved by MSG91

#### **MSG91_ROUTE**
- **What:** Route for SMS delivery
- **Options:**
  - `1` - Promotional
  - `4` - Transactional (recommended)
- **Default:** `4`
- **Required:** No

#### **MSG91_FLOW_ID**
- **What:** Flow ID for template-based SMS
- **Format:** String (e.g., "60f1b2c3d4e5f6a7b8c9d0e")
- **Required:** No
- **Note:** Only if using MSG91 templates

### **SMS Pricing (MSG91):**
- **Indian Numbers:** ₹0.15-0.25 per SMS
- **No setup fees**
- **No monthly charges**
- **Pay per use**

### **SMS Pricing (Twilio - for comparison):**
- **Indian Numbers:** $0.05-0.10 per SMS
- **US Numbers:** $0.0075 per SMS
- **Monthly charges:** $1+ for phone numbers

## 🚀 **Smart SMS System**

### **How It Works:**
```javascript
// Smart SMS sending logic
if (MSG91_AUTH_KEY) {
  // Try MSG91 first (better for Indian numbers)
  return await sendSMSViaMSG91({ to, message });
} else if (TWILIO_ACCOUNT_SID) {
  // Fall back to Twilio
  return await sendSMS({ to, message });
} else {
  // Log message if no provider configured
  return { success: true, message: 'SMS logged' };
}
```

### **Benefits:**
- ✅ **Automatic fallback** to Twilio if MSG91 fails
- ✅ **Better rates** for Indian numbers
- ✅ **No configuration changes** needed in frontend
- ✅ **Seamless switching** between providers

## 🧪 **Testing Your Setup**

### **1. Test SMS Functionality:**

#### **Via Frontend:**
1. **Go to** forgot password page
2. **Enter** your mobile number
3. **Click** "Send OTP"
4. **Check** your phone for SMS

#### **Via API:**
```bash
# Test forgot password with SMS
curl -X POST https://your-backend-url.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210"
  }'
```

### **2. Check Logs:**

#### **Backend Logs:**
```bash
# Look for these log messages
📱 MSG91 SMS Request Debug:
- Original number: 9876543210
- Formatted number: +919876543210
- Message: Your password reset code is: 123456
- MSG91 Auth Key: Set
- MSG91 Sender ID: PERSDB
- MSG91 Route: 4

🚀 Sending SMS via MSG91...
✅ MSG91 SMS sent successfully: { messageId: "MSG91_SENT" }
```

### **3. Verify SMS Delivery:**
- **Check** your mobile phone
- **Look for** SMS from sender ID "PERSDB"
- **Verify** OTP code is correct

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. "MSG91 not configured" Error:**
```bash
# Check environment variables
echo $MSG91_AUTH_KEY
echo $MSG91_SENDER_ID
echo $MSG91_ROUTE
```

**Solution:** Ensure all MSG91 environment variables are set.

#### **2. "Invalid Auth Key" Error:**
```bash
# Verify auth key format
# Should be a string like: "1234567890abcdef"
```

**Solution:** Check your auth key in MSG91 dashboard.

#### **3. "Invalid Sender ID" Error:**
```bash
# Sender ID must be:
# - Maximum 6 characters
# - Alphanumeric only
# - Approved by MSG91
```

**Solution:** Use a shorter, approved sender ID.

#### **4. "SMS not delivered" Issue:**
- **Check** phone number format (10 digits)
- **Verify** MSG91 account balance
- **Check** sender ID approval status
- **Try** different route (1 or 4)

### **Debug Steps:**

#### **1. Check Environment Variables:**
```bash
# In your backend logs, look for:
MSG91_AUTH_KEY: Set/Not set
MSG91_SENDER_ID: PERSDB/Not set
MSG91_ROUTE: 4/Not set
```

#### **2. Test API Directly:**
```bash
# Test MSG91 API directly
curl -X POST https://api.msg91.com/api/v5/flow/ \
  -H "Content-Type: application/json" \
  -H "authkey: YOUR_AUTH_KEY" \
  -d '{
    "flow_id": "default_flow",
    "sender": "PERSDB",
    "mobiles": "9876543210",
    "message": "Test message",
    "route": "4"
  }'
```

#### **3. Check MSG91 Dashboard:**
- **Go to** MSG91 dashboard
- **Check** "Reports" section
- **Look for** delivery status
- **Check** account balance

## 📊 **Performance Comparison**

### **MSG91 vs Twilio:**

| Feature | MSG91 | Twilio |
|---------|-------|--------|
| **Indian SMS Cost** | ₹0.15-0.25 | $0.05-0.10 |
| **Setup Required** | Account + Auth Key | Account + Phone Number |
| **Trial Limitations** | None | Verified numbers only |
| **Indian Number Support** | Native | Limited |
| **Delivery Speed** | Fast (India) | Fast (Global) |
| **Reliability** | High (India) | High (Global) |

### **Recommendation:**
- **Use MSG91** for Indian users (better rates, no limitations)
- **Keep Twilio** as fallback for international users
- **Smart system** automatically chooses the best provider

## 🎯 **Next Steps**

### **1. Complete Setup:**
1. **Create** MSG91 account
2. **Get** API credentials
3. **Configure** environment variables
4. **Test** SMS functionality

### **2. Deploy Changes:**
1. **Commit** code changes
2. **Push** to repository
3. **Deploy** to Render
4. **Test** in production

### **3. Monitor Usage:**
1. **Check** MSG91 dashboard for usage
2. **Monitor** SMS delivery rates
3. **Track** costs and performance
4. **Optimize** as needed

## 📞 **Support**

### **MSG91 Support:**
- **Email:** support@msg91.com
- **Phone:** +91-120-400-4000
- **Documentation:** [https://docs.msg91.com](https://docs.msg91.com)

### **Application Support:**
- **Check** backend logs for errors
- **Verify** environment variables
- **Test** API endpoints
- **Review** this guide for troubleshooting

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintained by:** Development Team