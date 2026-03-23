export const CONFIG_SCHEMA = {
  profiles: ['development', 'production'],
  targets: {
    worker: {
      requiredNonSecrets: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ],
      requiredSecrets: [
        'SUPABASE_SECRET_API_KEY',
        'DASHBOARD_PASSWORD',
        'DASHBOARD_SESSION_SECRET',
      ],
    },
  },
}

export const PLACEHOLDER_PATTERNS = [
  /^$/,
  /^change-me$/i,
  /^replace-me$/i,
  /^your-/i,
  /^https:\/\/your-/i,
]

export function isPlaceholder(value) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(String(value ?? '').trim()))
}
