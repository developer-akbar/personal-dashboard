import { useEffect, useState } from 'react'

export function useToastReady() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Ensure toast system is ready by waiting for the next tick
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return isReady
}