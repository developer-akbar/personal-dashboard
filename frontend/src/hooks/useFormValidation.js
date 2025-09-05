import { useState, useCallback } from 'react'
import { validateFormData, formValidationRules, ValidationError, validatePassword } from '../utils/validation'
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
  const [data, setData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
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
      if (field === 'currentPassword') {
        if (!value || typeof value !== 'string') {
          throw new ValidationError('Current password is required', 'currentPassword', value)
        }
        return true
      } else if (field === 'newPassword') {
        validatePassword(value)
        return true
      } else if (field === 'confirmPassword') {
        if (!value || typeof value !== 'string') {
          throw new ValidationError('Please confirm your new password', 'confirmPassword', value)
        }
        if (value !== data.newPassword) {
          throw new ValidationError('Passwords do not match', 'confirmPassword', value)
        }
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
  }, [data.newPassword])

  const validateForm = useCallback(async () => {
    setIsValidating(true)
    setErrors({})
    
    try {
      // Validate current password
      if (!data.currentPassword || typeof data.currentPassword !== 'string') {
        throw new ValidationError('Current password is required', 'currentPassword', data.currentPassword)
      }
      
      // Validate new password
      const validatedNewPassword = validatePassword(data.newPassword)
      
      // Validate confirm password
      if (!data.confirmPassword || typeof data.confirmPassword !== 'string') {
        throw new ValidationError('Please confirm your new password', 'confirmPassword', data.confirmPassword)
      }
      if (data.confirmPassword !== data.newPassword) {
        throw new ValidationError('Passwords do not match', 'confirmPassword', data.confirmPassword)
      }
      
      setIsValidating(false)
      return { 
        isValid: true, 
        data: {
          currentPassword: data.currentPassword,
          newPassword: validatedNewPassword,
          confirmPassword: data.confirmPassword
        }
      }
    } catch (error) {
      setIsValidating(false)
      
      if (error instanceof ValidationError) {
        setErrors({ [error.field]: error.message })
        return { isValid: false, errors: { [error.field]: error.message } }
      }
      
      // Handle unexpected errors
      toast.error('Validation failed. Please check your input.')
      return { isValid: false, errors: {} }
    }
  }, [data])

  const resetForm = useCallback((newData = {}) => {
    setData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      ...newData
    })
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
  const isFormValid = !hasErrors && data.currentPassword && data.newPassword && data.confirmPassword

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