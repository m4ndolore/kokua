import { cookies } from 'next/headers'

const COOKIE_NAME = 'kokua_dash_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

export async function verifyDashboardAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false
  return token === process.env.DASHBOARD_PASSWORD
}

export async function setDashboardAuth(password: string): Promise<boolean> {
  if (password !== process.env.DASHBOARD_PASSWORD) return false
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
