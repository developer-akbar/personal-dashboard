import React from 'react'
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi'
import styles from './ErrorBoundary.module.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1
    })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // In production, you might want to send this to an error reporting service
    // Example: errorReportingService.captureException(error, { extra: errorInfo })
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  handleGoHome = () => {
    window.location.hash = '#/'
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  render() {
    if (this.state.hasError) {
      const { error, retryCount } = this.state
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>
              <FiAlertTriangle />
            </div>
            
            <h2 className={styles.errorTitle}>
              Oops! Something went wrong
            </h2>
            
            <p className={styles.errorMessage}>
              {retryCount > 2 
                ? "We're having trouble loading this page. Please try again later."
                : "Something unexpected happened. Don't worry, your data is safe."
              }
            </p>
            
            <div className={styles.errorActions}>
              <button 
                className={styles.retryButton}
                onClick={this.handleRetry}
                disabled={retryCount > 2}
              >
                <FiRefreshCw />
                {retryCount > 2 ? 'Too Many Retries' : 'Try Again'}
              </button>
              
              <button 
                className={styles.homeButton}
                onClick={this.handleGoHome}
              >
                <FiHome />
                Go Home
              </button>
            </div>
            
            {isDevelopment && error && (
              <details className={styles.errorDetails}>
                <summary>Error Details (Development Only)</summary>
                <pre className={styles.errorStack}>
                  {error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary(WrappedComponent, fallback = null) {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for programmatic error handling
export function useErrorHandler() {
  return (error, errorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    // You can add additional error handling logic here
    // For example, sending to an error reporting service
  }
}

export default ErrorBoundary