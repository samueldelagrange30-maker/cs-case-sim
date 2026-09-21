const ACCOUNTS_KEY = 'cs-case-sim-accounts-v1'
const SESSION_KEY = 'cs-case-sim-session-v1'

export interface AuthUser {
  email: string
  username: string
}

interface StoredAccount {
  email: string
  username: string
  /** Client-only mock — NOT secure hashing, sim only */
  password: string
  createdAt: number
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredAccount[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const u = JSON.parse(raw) as AuthUser
    if (!u?.email || !u?.username) return null
    return u
  } catch {
    return null
  }
}

function saveSession(user: AuthUser | null): void {
  if (!user) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function validateEmail(email: string): string | null {
  const e = email.trim().toLowerCase()
  if (!e) return 'Email requis.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Email invalide.'
  return null
}

export function validateUsername(username: string): string | null {
  const u = username.trim()
  if (!u) return 'Pseudo requis.'
  if (u.length < 3) return 'Pseudo trop court (min. 3).'
  if (u.length > 24) return 'Pseudo trop long (max. 24).'
  if (!/^[a-zA-Z0-9_\-.]+$/.test(u))
    return 'Pseudo : lettres, chiffres, _ - . uniquement.'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Mot de passe requis.'
  if (password.length < 4) return 'Mot de passe trop court (min. 4).'
  return null
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string }

export function registerAccount(
  email: string,
  username: string,
  password: string,
): AuthResult {
  const emailErr = validateEmail(email)
  if (emailErr) return { ok: false, error: emailErr }
  const userErr = validateUsername(username)
  if (userErr) return { ok: false, error: userErr }
  const passErr = validatePassword(password)
  if (passErr) return { ok: false, error: passErr }

  const e = email.trim().toLowerCase()
  const u = username.trim()
  const accounts = loadAccounts()
  if (accounts.some((a) => a.email === e)) {
    return { ok: false, error: 'Un compte existe déjà avec cet email.' }
  }
  if (accounts.some((a) => a.username.toLowerCase() === u.toLowerCase())) {
    return { ok: false, error: 'Ce pseudo est déjà pris.' }
  }

  accounts.push({
    email: e,
    username: u,
    password,
    createdAt: Date.now(),
  })
  saveAccounts(accounts)
  const user = { email: e, username: u }
  saveSession(user)
  return { ok: true, user }
}

export function loginAccount(email: string, password: string): AuthResult {
  const emailErr = validateEmail(email)
  if (emailErr) return { ok: false, error: emailErr }
  if (!password) return { ok: false, error: 'Mot de passe requis.' }

  const e = email.trim().toLowerCase()
  const accounts = loadAccounts()
  const acc = accounts.find((a) => a.email === e)
  if (!acc || acc.password !== password) {
    return { ok: false, error: 'Email ou mot de passe incorrect.' }
  }
  const user = { email: acc.email, username: acc.username }
  saveSession(user)
  return { ok: true, user }
}

/** Login also accepts username as identifier. */
export function loginWithIdentifier(
  identifier: string,
  password: string,
): AuthResult {
  const id = identifier.trim()
  if (!id) return { ok: false, error: 'Email ou pseudo requis.' }
  if (!password) return { ok: false, error: 'Mot de passe requis.' }

  const accounts = loadAccounts()
  const lower = id.toLowerCase()
  const acc = accounts.find(
    (a) => a.email === lower || a.username.toLowerCase() === lower,
  )
  if (!acc || acc.password !== password) {
    return { ok: false, error: 'Identifiants incorrects.' }
  }
  const user = { email: acc.email, username: acc.username }
  saveSession(user)
  return { ok: true, user }
}

export function logoutSession(): void {
  saveSession(null)
}
