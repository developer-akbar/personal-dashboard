import nodemailer from 'nodemailer';

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
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('SMTP not configured, email would be sent to:', to);
      console.log('Subject:', subject);
      console.log('Content:', html || text);
      return { success: true, message: 'Email logged (SMTP not configured)' };
    }

    const info = await emailTransporter.sendMail({
      from: `"Personal Dashboard" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
}

// Send SMS (placeholder - integrate with SMS service like Twilio, AWS SNS, etc.)
export async function sendSMS({ to, message }) {
  try {
    // For development, just log the SMS
    if (process.env.NODE_ENV === 'development') {
      console.log('SMS would be sent to:', to);
      console.log('Message:', message);
      return { success: true, message: 'SMS logged (development mode)' };
    }

    // TODO: Integrate with actual SMS service
    // Example with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const result = await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: to
    // });
    // return { success: true, messageId: result.sid };

    console.log('SMS service not configured, SMS would be sent to:', to);
    console.log('Message:', message);
    return { success: true, message: 'SMS logged (service not configured)' };
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw new Error('Failed to send SMS');
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