import React, { useState, useEffect } from 'react';
import { FiSmartphone, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MSG91OTPWidget = ({ 
  onSuccess, 
  onError, 
  mobile, 
  setMobile, 
  isVisible = true,
  title = "Verify Mobile Number"
}) => {
  const [step, setStep] = useState('mobile'); // 'mobile', 'otp', 'success'
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Send OTP
  const sendOTP = async () => {
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setStep('otp');
        setCountdown(60); // 60 seconds countdown
        toast.success('OTP sent successfully!');
      } else {
        toast.error(data.error || 'Failed to send OTP');
        onError?.(data.error);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Failed to send OTP. Please try again.');
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        toast.success('Mobile number verified successfully!');
        onSuccess?.(data.user);
      } else {
        toast.error(data.error || 'Invalid OTP');
        onError?.(data.error);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Failed to verify OTP. Please try again.');
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/otp/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (data.success) {
        setCountdown(60);
        toast.success('OTP resent successfully!');
      } else {
        toast.error(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle mobile number input
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(value);
  };

  // Handle OTP input
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  // Reset widget
  const resetWidget = () => {
    setStep('mobile');
    setOtp('');
    setOtpSent(false);
    setCountdown(0);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '400px',
      margin: '0 auto',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'var(--primary-bg)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '24px',
          color: 'var(--primary-text)'
        }}>
          <FiSmartphone />
        </div>
        <h3 style={{
          margin: '0 0 8px',
          color: 'var(--text-primary)',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          {title}
        </h3>
        <p style={{
          margin: '0',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          {step === 'mobile' && 'Enter your mobile number to receive OTP'}
          {step === 'otp' && `Enter the 6-digit OTP sent to ${mobile.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')}`}
          {step === 'success' && 'Mobile number verified successfully!'}
        </p>
      </div>

      {/* Mobile Number Step */}
      {step === 'mobile' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Mobile Number
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={handleMobileChange}
              placeholder="9876543210"
              maxLength="10"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '16px',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>
          <button
            onClick={sendOTP}
            disabled={isLoading || !mobile || mobile.length !== 10}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: isLoading || !mobile || mobile.length !== 10 
                ? 'var(--disabled-bg)' 
                : 'var(--primary-bg)',
              color: isLoading || !mobile || mobile.length !== 10 
                ? 'var(--disabled-text)' 
                : 'var(--primary-text)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading || !mobile || mobile.length !== 10 
                ? 'not-allowed' 
                : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? (
              <>
                <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </button>
        </div>
      )}

      {/* OTP Step */}
      {step === 'otp' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Enter OTP
            </label>
            <input
              type="tel"
              value={otp}
              onChange={handleOtpChange}
              placeholder="123456"
              maxLength="6"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '16px',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
                textAlign: 'center',
                letterSpacing: '2px'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <button
              onClick={verifyOTP}
              disabled={isLoading || !otp || otp.length !== 6}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: isLoading || !otp || otp.length !== 6 
                  ? 'var(--disabled-bg)' 
                  : 'var(--primary-bg)',
                color: isLoading || !otp || otp.length !== 6 
                  ? 'var(--disabled-text)' 
                  : 'var(--primary-text)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading || !otp || otp.length !== 6 
                  ? 'not-allowed' 
                  : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
                  Verifying...
                </>
              ) : (
                <>
                  <FiCheck />
                  Verify OTP
                </>
              )}
            </button>
            
            <button
              onClick={resendOTP}
              disabled={isLoading || countdown > 0}
              style={{
                padding: '12px 16px',
                background: isLoading || countdown > 0 
                  ? 'var(--disabled-bg)' 
                  : 'var(--secondary-bg)',
                color: isLoading || countdown > 0 
                  ? 'var(--disabled-text)' 
                  : 'var(--secondary-text)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading || countdown > 0 
                  ? 'not-allowed' 
                  : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <FiRefreshCw />
              {countdown > 0 ? `${countdown}s` : 'Resend'}
            </button>
          </div>

          <button
            onClick={resetWidget}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Change Mobile Number
          </button>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'var(--success-bg)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px',
            color: 'var(--success-text)'
          }}>
            <FiCheck />
          </div>
          <p style={{
            margin: '0 0 16px',
            color: 'var(--text-primary)',
            fontSize: '16px'
          }}>
            Mobile number verified successfully!
          </p>
          <button
            onClick={resetWidget}
            style={{
              padding: '8px 16px',
              background: 'var(--primary-bg)',
              color: 'var(--primary-text)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Verify Another Number
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MSG91OTPWidget;