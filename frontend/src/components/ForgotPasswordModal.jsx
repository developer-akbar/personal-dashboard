import React, { useState } from 'react'
import { FiX, FiMail, FiPhone, FiArrowLeft, FiCheck } from 'react-icons/fi'
import api from '../api/client'
import toast from 'react-hot-toast'
import styles from './ForgotPasswordModal.module.css'

export default function ForgotPasswordModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState('email') // 'email', 'otp', 'newPassword'
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpMethod, setOtpMethod] = useState('email') // 'email' or 'sms'

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setOtpSent(true)
      setOtpMethod('email')
      setStep('otp')
      toast.success('Reset code sent to your email')
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleSmsSubmit = async (e) => {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error('Please enter your mobile number')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { phone: phone.trim() })
      setOtpSent(true)
      setOtpMethod('sms')
      setStep('otp')
      toast.success('Reset code sent to your mobile')
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (!otp.trim()) {
      toast.error('Please enter the verification code')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/verify-otp', { 
        otp: otp.trim(),
        email: email,
        phone: phone
      })
      setStep('newPassword')
      toast.success('Code verified successfully')
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword.trim()) {
      toast.error('Please enter a new password')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email: email,
        phone: phone,
        otp: otp,
        newPassword: newPassword
      })
      toast.success('Password reset successfully')
      onSuccess?.()
      handleClose()
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('email')
    setEmail('')
    setPhone('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setOtpSent(false)
    setOtpMethod('email')
    onClose()
  }

  const goBack = () => {
    if (step === 'otp') {
      setStep('email')
      setOtpSent(false)
    } else if (step === 'newPassword') {
      setStep('otp')
    }
  }

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {step !== 'email' && (
              <button className={styles.backButton} onClick={goBack}>
                <FiArrowLeft />
              </button>
            )}
            <h3>Reset Password</h3>
          </div>
          <button className={styles.closeButton} onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className={styles.content}>
          {step === 'email' && (
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <h4>Choose Reset Method</h4>
                <p>How would you like to receive your reset code?</p>
              </div>

              <div className={styles.methodButtons}>
                <button
                  className={`${styles.methodButton} ${otpMethod === 'email' ? styles.active : ''}`}
                  onClick={() => setOtpMethod('email')}
                >
                  <FiMail className={styles.methodIcon} />
                  <div>
                    <h5>Email</h5>
                    <p>Send code to your email address</p>
                  </div>
                </button>

                <button
                  className={`${styles.methodButton} ${otpMethod === 'sms' ? styles.active : ''}`}
                  onClick={() => setOtpMethod('sms')}
                >
                  <FiPhone className={styles.methodIcon} />
                  <div>
                    <h5>SMS</h5>
                    <p>Send code to your mobile number</p>
                  </div>
                </button>
              </div>

              {otpMethod === 'email' ? (
                <form onSubmit={handleEmailSubmit} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <FiMail className={styles.inputIcon} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSmsSubmit} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <FiPhone className={styles.inputIcon} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your mobile number"
                      required
                    />
                  </div>
                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </form>
              )}
            </div>
          )}

          {step === 'otp' && (
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <h4>Enter Verification Code</h4>
                <p>
                  We sent a 6-digit code to your {otpMethod === 'email' ? 'email' : 'mobile'}
                  {otpMethod === 'email' ? ` (${email})` : ` (${phone})`}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className={styles.form}>
                <div className={styles.otpInput}>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className={styles.otpField}
                  />
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  type="button"
                  className={styles.resendButton}
                  onClick={() => {
                    if (otpMethod === 'email') {
                      handleEmailSubmit({ preventDefault: () => {} })
                    } else {
                      handleSmsSubmit({ preventDefault: () => {} })
                    }
                  }}
                >
                  Resend Code
                </button>
              </form>
            </div>
          )}

          {step === 'newPassword' && (
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <h4>Create New Password</h4>
                <p>Enter a strong password for your account</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}