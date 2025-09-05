import React, { useState } from 'react'
import { FiX, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import styles from './PasswordChangeModal.module.css'

export default function PasswordChangeModal({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required'
    }
    
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, number, and special character'
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!validateForm()) return

    setSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      onClose()
    } catch (error) {
      console.error('Password change failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Change Password</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.warning}>
            <FiLock className={styles.warningIcon} />
            <div>
              <strong>Security Notice</strong>
              <p>Choose a strong password that you haven't used before. This will log you out of all other devices.</p>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <FiLock className={styles.inputIcon} />
            <label>
              Current Password
              <div className={styles.passwordInput}>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.currentPassword && <span className={styles.error}>{errors.currentPassword}</span>}
            </label>
          </div>

          <div className={styles.inputGroup}>
            <FiLock className={styles.inputIcon} />
            <label>
              New Password
              <div className={styles.passwordInput}>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.newPassword && <span className={styles.error}>{errors.newPassword}</span>}
            </label>
          </div>

          <div className={styles.inputGroup}>
            <FiLock className={styles.inputIcon} />
            <label>
              Confirm New Password
              <div className={styles.passwordInput}>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
            </label>
          </div>

          <div className={styles.passwordRequirements}>
            <h4>Password Requirements:</h4>
            <ul>
              <li className={formData.newPassword?.length >= 8 ? styles.valid : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(formData.newPassword || '') ? styles.valid : ''}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(formData.newPassword || '') ? styles.valid : ''}>
                One lowercase letter
              </li>
              <li className={/\d/.test(formData.newPassword || '') ? styles.valid : ''}>
                One number
              </li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword || '') ? styles.valid : ''}>
                One special character
              </li>
            </ul>
          </div>

          <div className={styles.actions}>
            <button 
              type="button" 
              className={styles.cancelButton} 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={submitting}
            >
              {submitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}