// Environment and configuration constants
export const APP_CONFIG = {
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
} as const

// Validate production environment
if (APP_CONFIG.IS_PRODUCTION && APP_CONFIG.SITE_URL.includes("localhost")) {
  console.error("[Config] Production environment detected but SITE_URL still contains localhost")
}

// URL utility function to ensure consistent URL generation
export function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return 'https://awakenhub.org'
  }
  
  return process.env.NEXT_PUBLIC_SITE_URL || 
         process.env.NEXT_PUBLIC_BASE_URL || 
         'https://awakenhub.org'
}

// Cache durations
export const CACHE_DURATIONS = {
  TEST_RESULTS: 10 * 60 * 1000, // 10 minutes
  USER_DATA: 5 * 60 * 1000, // 5 minutes
  CHECKIN_DATA: 3 * 60 * 1000, // 3 minutes
} as const

// Request timeouts
export const TIMEOUTS = {
  DATABASE_QUERY: 8000, // 8 seconds
  API_REQUEST: 10000, // 10 seconds
  USER_AUTH: 5000, // 5 seconds
} as const
