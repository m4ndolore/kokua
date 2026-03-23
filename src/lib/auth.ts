import { cookies } from 'next/headers'
import { getServiceClient } from './supabase'
import type { Role, DashboardUser } from './types'

const COOKIE_NAME = 'kokua_dash_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

export type AuthSession = {
  authenticated: true
  user: DashboardUser
} | {
  authenticated: false
  user: null
}

export async function verifyDashboardAuth(): Promise<AuthSession> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return { authenticated: false, user: null }

  // Check for legacy single-password auth
  if (token === process.env.DASHBOARD_PASSWORD) {
    // Legacy mode: treat as admin
    return {
      authenticated: true,
      user: {
        id: 'legacy',
        created_at: '',
        email: 'admin@local',
        name: 'Admin',
        role: 'admin',
        is_active: true,
      },
    }
  }

  // Role-based auth: token is "email:password"
  try {
    const [email] = token.split(':')
    if (!email) return { authenticated: false, user: null }

    const supabase = getServiceClient()
    const { data } = await supabase
      .from('dashboard_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (!data) return { authenticated: false, user: null }

    return { authenticated: true, user: data as DashboardUser }
  } catch {
    return { authenticated: false, user: null }
  }
}

export async function setDashboardAuth(password: string): Promise<boolean> {
  // Check legacy single password
  if (password === process.env.DASHBOARD_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return true
  }

  // Check email-based login: "email:password"
  // For simplicity, coordinators/admins use their email + the shared password
  // The password is still DASHBOARD_PASSWORD, but we track who logged in
  const parts = password.split(':')
  if (parts.length === 2) {
    const [email, pwd] = parts
    if (pwd !== process.env.DASHBOARD_PASSWORD) return false

    const supabase = getServiceClient()
    const { data } = await supabase
      .from('dashboard_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (!data) return false

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, `${email}:${pwd}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return true
  }

  return false
}

export function hasRole(session: AuthSession, ...roles: Role[]): boolean {
  if (!session.authenticated) return false
  return roles.includes(session.user.role)
}

export function isAdmin(session: AuthSession): boolean {
  return hasRole(session, 'admin')
}

export function isCoordinator(session: AuthSession): boolean {
  return hasRole(session, 'coordinator', 'admin')
}
