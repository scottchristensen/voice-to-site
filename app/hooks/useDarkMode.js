'use client'

import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check system preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(darkModeMediaQuery.matches)

    // Listen for changes
    const handleChange = (e) => setIsDarkMode(e.matches)
    darkModeMediaQuery.addEventListener('change', handleChange)

    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isDarkMode
}
