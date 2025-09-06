import nodemailer from 'nodemailer';
import axios from 'axios';

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send email
export async function sendEmail({ to, subject, html, text }) {
  try {
    console.log('📧 Email Request Debug:');
    console.log('- To:', to);
    console.log('- Subject:', subject);
    console.log('- SMTP Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('- SMTP Port:', process.env.SMTP_PORT || 587);
    console.log('- SMTP User:', process.env.SMTP_USER ? 'Set' : 'Not set');
    console.log('- SMTP Pass:', process.env.SMTP_PASS ? 'Set' : 'Not set');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('❌ SMTP not configured, email would be sent to:', to);
      console.log('Subject:', subject);
      console.log('Content:', html || text);
      return { success: true, message: 'Email logged (SMTP not configured)' };
    }

    console.log('🚀 Sending email via SMTP...');
    const info = await emailTransporter.sendMail({
      from: `"Personal Dashboard" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Format phone number for Indian numbers
function formatIndianPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it already starts with +91, return as is
  if (phoneNumber.startsWith('+91')) {
    return phoneNumber;
  }
  
  // If it starts with 91 and has 12 digits, add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  // If it's a 10-digit Indian number, add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it's already in international format, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // Default: assume it's a 10-digit Indian number
  return `+91${cleaned}`;
}

// Send SMS using Twilio
export async function sendSMS({ to, message }) {
  try {
    // Format the phone number for Indian numbers
    const formattedNumber = formatIndianPhoneNumber(to);
    
    console.log('📱 SMS Request Debug:');
    console.log('- Original number:', to);
    console.log('- Formatted number:', formattedNumber);
    console.log('- Message:', message);
    console.log('- Twilio Account SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set');
    console.log('- Twilio Auth Token:', process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set');
    console.log('- Twilio Phone Number:', process.env.TWILIO_PHONE_NUMBER ? 'Set' : 'Not set');

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log('❌ Twilio not configured, SMS would be sent to:', formattedNumber);
      console.log('Message:', message);
      return { success: true, message: 'SMS logged (Twilio not configured)' };
    }

    // Import Twilio dynamically
    const { default: twilio } = await import('twilio');
    
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    console.log('🚀 Sending SMS via Twilio...');
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });
    
    console.log('✅ SMS sent successfully:', result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ SMS sending failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    });
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

// Send SMS using MSG91
export async function sendSMSViaMSG91({ to, message }) {
  try {
    // Format the phone number for Indian numbers
    const formattedNumber = formatIndianPhoneNumber(to);
    
    console.log('📱 MSG91 SMS Request Debug:');
    console.log('- Original number:', to);
    console.log('- Formatted number:', formattedNumber);
    console.log('- Message:', message);
    console.log('- MSG91 Auth Key:', process.env.MSG91_AUTH_KEY ? 'Set' : 'Not set');
    console.log('- MSG91 Sender ID:', process.env.MSG91_SENDER_ID || 'Not set');
    console.log('- MSG91 Route:', process.env.MSG91_ROUTE || '4');

    // Check if MSG91 is configured
    if (!process.env.MSG91_AUTH_KEY) {
      console.log('❌ MSG91 not configured, SMS would be sent to:', formattedNumber);
      console.log('Message:', message);
      return { success: true, message: 'SMS logged (MSG91 not configured)' };
    }

    // Remove +91 prefix for MSG91 (it expects 10-digit numbers)
    const phoneNumber = formattedNumber.replace('+91', '');
    
    const url = 'https://api.msg91.com/api/v5/flow/';
    const payload = {
      flow_id: process.env.MSG91_FLOW_ID || 'default_flow',
      sender: process.env.MSG91_SENDER_ID || 'PERSDB',
      mobiles: phoneNumber,
      message: message,
      route: process.env.MSG91_ROUTE || '4'
    };

    console.log('🚀 Sending SMS via MSG91...');
    console.log('Payload:', payload);
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'authkey': process.env.MSG91_AUTH_KEY
      },
      timeout: 10000
    });
    
    console.log('✅ MSG91 SMS sent successfully:', response.data);
    return { success: true, messageId: response.data.messageId || 'MSG91_SENT' };
  } catch (error) {
    console.error('❌ MSG91 SMS sending failed:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(`Failed to send SMS via MSG91: ${error.message}`);
  }
}

// Smart SMS sending - tries MSG91 first, falls back to Twilio
export async function sendSMSSmart({ to, message }) {
  try {
    // Try MSG91 first (better for Indian numbers)
    if (process.env.MSG91_AUTH_KEY) {
      console.log('🔄 Trying MSG91 first...');
      return await sendSMSViaMSG91({ to, message });
    }
    
    // Fall back to Twilio if MSG91 not configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      console.log('🔄 Falling back to Twilio...');
      return await sendSMS({ to, message });
    }
    
    // If neither is configured, log the message
    console.log('❌ No SMS provider configured, logging message:');
    console.log('To:', to);
    console.log('Message:', message);
    return { success: true, message: 'SMS logged (no provider configured)' };
  } catch (error) {
    console.error('❌ Smart SMS sending failed:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

// Test email configuration
export async function testEmailConfig() {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { success: false, message: 'SMTP credentials not configured' };
    }

    await emailTransporter.verify();
    return { success: true, message: 'SMTP configuration is valid' };
  } catch (error) {
    return { success: false, message: `SMTP configuration error: ${error.message}` };
  }
}