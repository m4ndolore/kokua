import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { getServiceClient } from './supabase'
import type { Role, DashboardUser } from './types'

const COOKIE_NAME = 'kokua_dash_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

type SessionTokenPayload = {
  exp: number
  user: DashboardUser
}

export type AuthSession = {
  authenticated: true
  user: DashboardUser
} | {
  authenticated: false
  user: null
}

function getSharedPassword() {
  return process.env.DASHBOARD_PASSWORD
}

function getSessionSecret() {
  return process.env.DASHBOARD_SESSION_SECRET || process.env.DASHBOARD_PASSWORD
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signValue(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

function createSessionToken(user: DashboardUser) {
  const secret = getSessionSecret()
  if (!secret) return null

  const payload: SessionTokenPayload = {
    exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
    user,
  }
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signValue(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

function verifySessionToken(token: string): DashboardUser | null {
  const secret = getSessionSecret()
  if (!secret) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = signValue(encodedPayload, secret)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionTokenPayload
    if (!payload?.user || !payload?.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }
    return payload.user
  } catch {
    return null
  }
}

async function setDashboardCookie(user: DashboardUser) {
  const token = createSessionToken(user)
  if (!token) return false

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return true
}

export async function verifyDashboardAuth(): Promise<AuthSession> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return { authenticated: false, user: null }

  const user = verifySessionToken(token)
  if (!user) {
    return { authenticated: false, user: null }
  }

  try {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('dashboard_users')
      .select('*')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    if (!data) return { authenticated: false, user: null }

    return { authenticated: true, user: data as DashboardUser }
  } catch {
    return { authenticated: false, user: null }
  }
}

export async function setDashboardAuth(email: string, password: string): Promise<boolean> {
  const sharedPassword = getSharedPassword()
  if (!sharedPassword) return false

  if (!email || !password) return false
  if (password !== sharedPassword) return false

  const normalizedEmail = email.trim().toLowerCase()
  const bootstrapEmail = process.env.DASHBOARD_BOOTSTRAP_EMAIL?.trim().toLowerCase() || null

  const supabase = getServiceClient()
  const { data } = await supabase
    .from('dashboard_users')
    .select('*')
    .eq('email', normalizedEmail)
    .eq('is_active', true)
    .single()

  if (!data) {
    if (bootstrapEmail && normalizedEmail === bootstrapEmail) {
      const { data: upserted, error } = await supabase
        .from('dashboard_users')
        .upsert({
          email: normalizedEmail,
          name: 'Admin',
          role: 'admin',
          is_active: true,
        }, { onConflict: 'email' })
        .select('*')
        .single()

      if (error || !upserted) return false
      return setDashboardCookie(upserted as DashboardUser)
    }

    return false
  }

  return setDashboardCookie(data as DashboardUser)
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

export async function clearDashboardAuth(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

export async function requireDashboardUser(...roles: Role[]): Promise<DashboardUser> {
  const session = await verifyDashboardAuth()
  if (!session.authenticated) {
    throw new Error('Unauthorized dashboard action.')
  }

  if (roles.length > 0 && !roles.includes(session.user.role)) {
    throw new Error('Forbidden dashboard action.')
  }

  return session.user
}
