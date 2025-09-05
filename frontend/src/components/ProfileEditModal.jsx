import React, { useState, useEffect } from 'react'
import { FiX, FiUser, FiMail, FiPhone, FiImage } from 'react-icons/fi'
import { useProfileValidation } from '../hooks/useFormValidation'
import styles from './ProfileEditModal.module.css'

export default function ProfileEditModal({ open, onClose, onSubmit, initialData }) {
  const {
    data,
    errors,
    isValidating,
    updateField,
    validateField,
    validateForm,
    resetForm
  } = useProfileValidation()
  
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && initialData) {
      resetForm(initialData)
    }
  }, [open, initialData, resetForm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting || isValidating) return

    const validation = await validateForm()
    if (!validation.isValid) return

    setSubmitting(true)
    try {
      await onSubmit(validation.data)
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
              {data.avatarUrl ? (
                <img 
                  src={data.avatarUrl} 
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
                style={{ display: data.avatarUrl ? 'none' : 'flex' }}
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
                  value={data.avatarUrl || ''}
                  onChange={(e) => updateField('avatarUrl', e.target.value)}
                  onBlur={(e) => validateField('avatarUrl', e.target.value)}
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
                value={data.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                onBlur={(e) => validateField('name', e.target.value)}
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
                value={data.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                onBlur={(e) => validateField('email', e.target.value)}
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
                value={data.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                onBlur={(e) => validateField('phone', e.target.value)}
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
              disabled={submitting || isValidating}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}