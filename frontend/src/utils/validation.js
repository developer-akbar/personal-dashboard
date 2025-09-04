// Input validation utilities for security and data integrity

export const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
  },
  serviceNumber: {
    pattern: /^\d{13}$/,
    message: 'Service number must be exactly 13 digits'
  },
  label: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
    message: 'Label must be 1-50 characters, letters, numbers, spaces, hyphens, and underscores only'
  },
  amount: {
    pattern: /^\d+(\.\d{1,2})?$/,
    message: 'Amount must be a valid number with up to 2 decimal places'
  }
}

export class ValidationError extends Error {
  constructor(message, field, value) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'email', email)
  }
  
  const trimmedEmail = email.trim().toLowerCase()
  
  if (!validationRules.email.pattern.test(trimmedEmail)) {
    throw new ValidationError(validationRules.email.message, 'email', email)
  }
  
  if (trimmedEmail.length > 254) {
    throw new ValidationError('Email is too long', 'email', email)
  }
  
  return trimmedEmail
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required', 'password', password)
  }
  
  if (password.length < validationRules.password.minLength) {
    throw new ValidationError(`Password must be at least ${validationRules.password.minLength} characters`, 'password', password)
  }
  
  if (!validationRules.password.pattern.test(password)) {
    throw new ValidationError(validationRules.password.message, 'password', password)
  }
  
  if (password.length > 128) {
    throw new ValidationError('Password is too long', 'password', password)
  }
  
  return password
}

export function validateServiceNumber(serviceNumber) {
  if (!serviceNumber || typeof serviceNumber !== 'string') {
    throw new ValidationError('Service number is required', 'serviceNumber', serviceNumber)
  }
  
  const trimmed = serviceNumber.trim()
  
  if (!validationRules.serviceNumber.pattern.test(trimmed)) {
    throw new ValidationError(validationRules.serviceNumber.message, 'serviceNumber', serviceNumber)
  }
  
  return trimmed
}

export function validateLabel(label) {
  if (!label || typeof label !== 'string') {
    throw new ValidationError('Label is required', 'label', label)
  }
  
  const trimmed = label.trim()
  
  if (trimmed.length < validationRules.label.minLength) {
    throw new ValidationError(`Label must be at least ${validationRules.label.minLength} character`, 'label', label)
  }
  
  if (trimmed.length > validationRules.label.maxLength) {
    throw new ValidationError(`Label must be no more than ${validationRules.label.maxLength} characters`, 'label', label)
  }
  
  if (!validationRules.label.pattern.test(trimmed)) {
    throw new ValidationError(validationRules.label.message, 'label', label)
  }
  
  return trimmed
}

export function validateAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    throw new ValidationError('Amount is required', 'amount', amount)
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    throw new ValidationError('Amount must be a valid number', 'amount', amount)
  }
  
  if (numAmount < 0) {
    throw new ValidationError('Amount cannot be negative', 'amount', amount)
  }
  
  if (numAmount > 999999999.99) {
    throw new ValidationError('Amount is too large', 'amount', amount)
  }
  
  return numAmount
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

export function validateFormData(data, rules) {
  const errors = {}
  const sanitizedData = {}
  
  for (const [field, value] of Object.entries(data)) {
    try {
      // Sanitize input first
      const sanitized = sanitizeInput(value)
      
      // Apply validation rule if exists
      if (rules[field]) {
        const validator = rules[field]
        sanitizedData[field] = validator(sanitized)
      } else {
        sanitizedData[field] = sanitized
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        errors[field] = error.message
      } else {
        errors[field] = 'Invalid input'
      }
    }
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Form validation failed', 'form', errors)
  }
  
  return sanitizedData
}

// Common validation rules for forms
export const formValidationRules = {
  login: {
    email: validateEmail,
    password: (pwd) => pwd && pwd.length > 0 ? pwd : (() => { throw new ValidationError('Password is required', 'password', pwd) })()
  },
  register: {
    email: validateEmail,
    password: validatePassword
  },
  account: {
    label: validateLabel,
    email: validateEmail,
    password: (pwd) => pwd && pwd.length > 0 ? pwd : (() => { throw new ValidationError('Password is required', 'password', pwd) })()
  },
  electricity: {
    serviceNumber: validateServiceNumber,
    label: validateLabel
  }
}

// Rate limiting for form submissions
const submissionAttempts = new Map()

export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now()
  const attempts = submissionAttempts.get(key) || []
  
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(time => now - time < windowMs)
  
  if (recentAttempts.length >= maxAttempts) {
    throw new ValidationError('Too many attempts. Please try again later.', 'rateLimit', key)
  }
  
  // Add current attempt
  recentAttempts.push(now)
  submissionAttempts.set(key, recentAttempts)
  
  return true
}