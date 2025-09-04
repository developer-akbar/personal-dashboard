import { useState, useCallback } from 'react'
import { validateFormData, formValidationRules, ValidationError } from '../utils/validation'
import toast from 'react-hot-toast'

export function useFormValidation(initialData = {}, rules = {}) {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [isValidating, setIsValidating] = useState(false)

  const updateField = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  const validateField = useCallback((field, value) => {
    try {
      if (rules[field]) {
        rules[field](value)
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
        return true
      }
      return true
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(prev => ({ ...prev, [field]: error.message }))
        return false
      }
      return false
    }
  }, [rules])

  const validateForm = useCallback(async () => {
    setIsValidating(true)
    setErrors({})
    
    try {
      const validatedData = validateFormData(data, rules)
      setIsValidating(false)
      return { isValid: true, data: validatedData }
    } catch (error) {
      setIsValidating(false)
      
      if (error instanceof ValidationError && error.field === 'form') {
        setErrors(error.value)
        return { isValid: false, errors: error.value }
      }
      
      // Handle unexpected errors
      toast.error('Validation failed. Please check your input.')
      return { isValid: false, errors: {} }
    }
  }, [data, rules])

  const resetForm = useCallback((newData = {}) => {
    setData(newData)
    setErrors({})
    setIsValidating(false)
  }, [])

  const setFieldError = useCallback((field, message) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const hasErrors = Object.keys(errors).length > 0
  const isFormValid = !hasErrors && Object.keys(data).length > 0

  return {
    data,
    errors,
    isValidating,
    hasErrors,
    isFormValid,
    updateField,
    validateField,
    validateForm,
    resetForm,
    setFieldError,
    clearErrors,
    setData
  }
}

// Pre-configured hooks for common forms
export function useLoginValidation() {
  return useFormValidation(
    { email: '', password: '' },
    formValidationRules.login
  )
}

export function useRegisterValidation() {
  return useFormValidation(
    { email: '', password: '' },
    formValidationRules.register
  )
}

export function useAccountValidation() {
  return useFormValidation(
    { label: '', email: '', password: '', region: 'amazon.in' },
    formValidationRules.account
  )
}

export function useElectricityValidation() {
  return useFormValidation(
    { serviceNumber: '', label: '' },
    formValidationRules.electricity
  )
}

export function useProfileValidation() {
  return useFormValidation(
    { name: '', email: '', phone: '', avatarUrl: '' },
    {
      name: (name) => {
        if (!name || typeof name !== 'string') {
          throw new ValidationError('Name is required', 'name', name)
        }
        const trimmed = name.trim()
        if (trimmed.length < 2) {
          throw new ValidationError('Name must be at least 2 characters', 'name', name)
        }
        if (trimmed.length > 50) {
          throw new ValidationError('Name must be no more than 50 characters', 'name', name)
        }
        return trimmed
      },
      email: validateEmail,
      phone: (phone) => {
        if (!phone || typeof phone !== 'string') {
          return '' // Phone is optional
        }
        const trimmed = phone.trim()
        if (trimmed && !/^\+?[\d\s\-\(\)]{10,15}$/.test(trimmed)) {
          throw new ValidationError('Please enter a valid phone number', 'phone', phone)
        }
        return trimmed
      },
      avatarUrl: (url) => {
        if (!url || typeof url !== 'string') {
          return '' // Avatar URL is optional
        }
        const trimmed = url.trim()
        if (trimmed && !/^https?:\/\/.+/.test(trimmed)) {
          throw new ValidationError('Please enter a valid URL starting with http:// or https://', 'avatarUrl', url)
        }
        return trimmed
      }
    }
  )
}

export function usePasswordValidation() {
  return useFormValidation(
    { currentPassword: '', newPassword: '', confirmPassword: '' },
    {
      currentPassword: (password) => {
        if (!password || typeof password !== 'string') {
          throw new ValidationError('Current password is required', 'currentPassword', password)
        }
        return password
      },
      newPassword: validatePassword,
      confirmPassword: (confirm, formData) => {
        if (!confirm || typeof confirm !== 'string') {
          throw new ValidationError('Please confirm your new password', 'confirmPassword', confirm)
        }
        if (confirm !== formData.newPassword) {
          throw new ValidationError('Passwords do not match', 'confirmPassword', confirm)
        }
        return confirm
      }
    }
  )
}