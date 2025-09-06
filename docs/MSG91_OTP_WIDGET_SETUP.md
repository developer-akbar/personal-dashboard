# MSG91 OTP Widget Setup Guide

## 🎯 **Overview**

This guide helps you set up MSG91's OTP widget for mobile number verification in your Personal Dashboard application.

## 🔧 **Required Information**

### **Please provide these details from your MSG91 account:**

#### **1. Auth Key (You already have this):**
```bash
MSG91_AUTH_KEY=your_auth_key_here
```

#### **2. Template ID (Need to create):**
```bash
MSG91_TEMPLATE_ID=your_template_id_here
```

#### **3. Sender ID (You already have this):**
```bash
MSG91_SENDER_ID=PERSDB
```

## 🚀 **Step-by-Step Setup**

### **Step 1: Create OTP Template in MSG91**

#### **1.1 Login to MSG91 Dashboard:**
1. **Go to:** [https://control.msg91.com](https://control.msg91.com)
2. **Login** with your credentials

#### **1.2 Create OTP Template:**
1. **Navigate to:** "Templates" → "OTP Templates"
2. **Click** "Create New Template"
3. **Fill in details:**
   - **Template Name:** Personal Dashboard OTP
   - **Template Type:** OTP
   - **Message:** `Your OTP for Personal Dashboard is {{otp}}. Valid for 10 minutes.`
   - **Language:** English
   - **Category:** Transactional
4. **Submit** for approval
5. **Wait** for approval (usually instant)
6. **Copy** the Template ID

#### **1.3 Alternative - Use Simple SMS:**
If template approval takes time, you can use simple SMS without templates.

### **Step 2: Configure Environment Variables**

#### **2.1 For Render (Production):**
Add these to your Render environment variables:

```bash
# MSG91 Configuration
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=PERSDB
MSG91_ROUTE=4
MSG91_TEMPLATE_ID=your_template_id_here

# Optional - for OTP widget
MSG91_OTP_LENGTH=6
MSG91_OTP_EXPIRY=600
```

#### **2.2 For Local Development:**
Add to your `backend/.env` file:

```bash
# MSG91 Configuration
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=PERSDB
MSG91_ROUTE=4
MSG91_TEMPLATE_ID=your_template_id_here
MSG91_OTP_LENGTH=6
MSG91_OTP_EXPIRY=600
```

### **Step 3: Backend Implementation**

#### **3.1 OTP Routes (Already created):**
- **`/api/otp/send`** - Send OTP to mobile
- **`/api/otp/verify`** - Verify OTP
- **`/api/otp/resend`** - Resend OTP

#### **3.2 API Endpoints:**

##### **Send OTP:**
```bash
POST /api/otp/send
Content-Type: application/json

{
  "mobile": "9876543210"
}

# Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "mobile": "98****3210"
}
```

##### **Verify OTP:**
```bash
POST /api/otp/verify
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456"
}

# Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "phone": "9876543210",
    "userType": "Free",
    "subscription": "Free"
  }
}
```

##### **Resend OTP:**
```bash
POST /api/otp/resend
Content-Type: application/json

{
  "mobile": "9876543210"
}

# Response:
{
  "success": true,
  "message": "OTP resent successfully",
  "mobile": "98****3210"
}
```

### **Step 4: Frontend Implementation**

#### **4.1 OTP Widget Component (Already created):**
- **File:** `frontend/src/components/MSG91OTPWidget.jsx`
- **Features:**
  - Mobile number input with validation
  - OTP input with 6-digit validation
  - Resend OTP with countdown timer
  - Success/error handling
  - Responsive design

#### **4.2 Usage Example:**
```jsx
import MSG91OTPWidget from './components/MSG91OTPWidget';

function ForgotPasswordPage() {
  const [mobile, setMobile] = useState('');
  const [showOTPWidget, setShowOTPWidget] = useState(false);

  const handleOTPSuccess = (user) => {
    console.log('OTP verified successfully:', user);
    // Handle successful verification
    setShowOTPWidget(false);
  };

  const handleOTPError = (error) => {
    console.error('OTP verification failed:', error);
    // Handle error
  };

  return (
    <div>
      {showOTPWidget ? (
        <MSG91OTPWidget
          mobile={mobile}
          setMobile={setMobile}
          onSuccess={handleOTPSuccess}
          onError={handleOTPError}
          title="Verify Mobile Number"
        />
      ) : (
        <button onClick={() => setShowOTPWidget(true)}>
          Verify Mobile Number
        </button>
      )}
    </div>
  );
}
```

### **Step 5: Integration with Existing Auth**

#### **5.1 Update Forgot Password Flow:**
```jsx
// In ForgotPasswordModal.jsx
import MSG91OTPWidget from './MSG91OTPWidget';

function ForgotPasswordModal() {
  const [step, setStep] = useState('input'); // 'input', 'otp', 'reset'
  const [mobile, setMobile] = useState('');

  if (step === 'otp') {
    return (
      <MSG91OTPWidget
        mobile={mobile}
        setMobile={setMobile}
        onSuccess={(user) => {
          setStep('reset');
          // Proceed to password reset
        }}
        onError={(error) => {
          toast.error(error);
        }}
        title="Verify Mobile Number"
      />
    );
  }

  // Rest of your existing code...
}
```

## 🧪 **Testing the Setup**

### **Step 1: Test Backend API:**
```bash
# Test send OTP
curl -X POST http://localhost:4000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210"}'

# Test verify OTP
curl -X POST http://localhost:4000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "otp": "123456"}'
```

### **Step 2: Test Frontend Widget:**
1. **Start** frontend server
2. **Navigate** to forgot password page
3. **Enter** mobile number
4. **Click** "Send OTP"
5. **Check** mobile for OTP
6. **Enter** OTP and verify

### **Step 3: Check Logs:**
```bash
# Backend logs should show:
📱 MSG91 SMS Request Debug:
- Original number: 9876543210
- Formatted number: +919876543210
- Message: Your OTP for Personal Dashboard is 123456. Valid for 10 minutes.
- MSG91 Auth Key: Set
- MSG91 Sender ID: PERSDB
- MSG91 Route: 4

🚀 Sending SMS via MSG91...
✅ MSG91 SMS sent successfully: SMS sent successfully
```

## 🔧 **Configuration Options**

### **Environment Variables:**

#### **Required:**
```bash
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=PERSDB
MSG91_ROUTE=4
```

#### **Optional:**
```bash
MSG91_TEMPLATE_ID=your_template_id_here
MSG91_OTP_LENGTH=6
MSG91_OTP_EXPIRY=600
MSG91_FLOW_ID=your_flow_id_here
```

### **Widget Customization:**

#### **Props:**
```jsx
<MSG91OTPWidget
  mobile={mobile}                    // Current mobile number
  setMobile={setMobile}              // Function to update mobile
  onSuccess={handleSuccess}          // Success callback
  onError={handleError}              // Error callback
  isVisible={true}                   // Show/hide widget
  title="Verify Mobile Number"       // Widget title
/>
```

#### **Styling:**
The widget uses CSS variables for theming:
```css
:root {
  --card-bg: #ffffff;
  --border-color: #e5e7eb;
  --primary-bg: #3b82f6;
  --primary-text: #ffffff;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --success-bg: #10b981;
  --success-text: #ffffff;
  --disabled-bg: #f3f4f6;
  --disabled-text: #9ca3af;
}
```

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **1. OTP Not Received:**
- **Check** MSG91 dashboard for delivery status
- **Verify** sender ID is approved
- **Check** account balance
- **Try** different sender ID

#### **2. Template Not Working:**
- **Use** simple SMS without template
- **Check** template approval status
- **Verify** template ID is correct

#### **3. API Errors:**
- **Check** auth key is correct
- **Verify** mobile number format
- **Check** rate limiting

### **Debug Steps:**

#### **1. Check Backend Logs:**
```bash
# Look for MSG91 API calls
grep "MSG91" backend/logs/app.log
```

#### **2. Test API Directly:**
```bash
# Test MSG91 API
curl "https://api.msg91.com/api/sendhttp.php?authkey=YOUR_AUTH_KEY&mobiles=9876543210&message=Test%20OTP&sender=PERSDB&route=4&country=91"
```

#### **3. Check MSG91 Dashboard:**
- **Go to** Reports section
- **Check** delivery status
- **Look for** error messages

## 📊 **Expected Results**

### **After Setup:**
- ✅ **OTP sent** to mobile number
- ✅ **OTP verified** successfully
- ✅ **User data** returned on success
- ✅ **Error handling** works properly
- ✅ **Resend OTP** functionality works
- ✅ **Countdown timer** works

### **Performance:**
- **OTP delivery:** 2-5 seconds
- **OTP verification:** < 1 second
- **Widget responsiveness:** Smooth
- **Error recovery:** Automatic

## 🎯 **Next Steps**

### **1. Provide Required Information:**
Please provide:
- **Template ID** (if using templates)
- **Any specific requirements** for OTP format
- **Preferred sender ID** (if different from PERSDB)

### **2. Test the Implementation:**
- **Deploy** the updated code
- **Test** OTP functionality
- **Verify** SMS delivery
- **Check** user experience

### **3. Customize as Needed:**
- **Adjust** OTP length (default: 6 digits)
- **Change** expiry time (default: 10 minutes)
- **Customize** widget styling
- **Add** additional validation

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintained by:** Development Team