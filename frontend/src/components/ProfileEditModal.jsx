import React, { useState, useEffect } from 'react'
import { FiX, FiUser, FiMail, FiPhone, FiImage } from 'react-icons/fi'
import styles from './ProfileEditModal.module.css'

export default function ProfileEditModal({ open, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        avatarUrl: initialData.avatarUrl || ''
      })
    }
  }, [open, initialData])

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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    if (formData.avatarUrl && !/^https?:\/\/.+/.test(formData.avatarUrl.trim())) {
      newErrors.avatarUrl = 'Please enter a valid URL starting with http:// or https://'
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
      onClose()
    } catch (error) {
      console.error('Profile update failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Edit Profile</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              {formData.avatarUrl ? (
                <img 
                  src={formData.avatarUrl} 
                  alt="Avatar" 
                  className={styles.avatar}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div 
                className={styles.avatarPlaceholder}
                style={{ display: formData.avatarUrl ? 'none' : 'flex' }}
              >
                <FiUser />
              </div>
            </div>
            <div className={styles.avatarInput}>
              <label className={styles.inputGroup}>
                <FiImage className={styles.inputIcon} />
                Avatar URL
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
                {errors.avatarUrl && <span className={styles.error}>{errors.avatarUrl}</span>}
              </label>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <FiUser className={styles.inputIcon} />
            <label>
              Full Name
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
              {errors.name && <span className={styles.error}>{errors.name}</span>}
            </label>
          </div>

          <div className={styles.inputGroup}>
            <FiMail className={styles.inputIcon} />
            <label>
              Email Address
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                required
              />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </label>
          </div>

          <div className={styles.inputGroup}>
            <FiPhone className={styles.inputIcon} />
            <label>
              Mobile Number
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your mobile number"
              />
              {errors.phone && <span className={styles.error}>{errors.phone}</span>}
            </label>
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}