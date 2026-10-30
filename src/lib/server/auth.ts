import type { D1Database } from '@cloudflare/workers-types'
import type { Cookies } from '@sveltejs/kit'
import { createToken, hashToken } from './crypto'
import { createUserFromEmail, getUserByEmail } from './repo'

// Sign-in by email link. No passwords. A link works once and
// dies after 15 minutes. A session lasts 30 days. Only hashes
// are stored, so a leaked table can't be used to sign in.

const LINK_MINUTES = 15
const SESSION_DAYS = 30
const RESEND_COOLDOWN_SECONDS = 60
export const SESSION_COOKIE = 'keylime_session'
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const addMinutes = (minutes: number): string => new Date(Date.now() + minutes * 60_000).toISOString()

type SessionUserT = { id: string; email: string }

type EnvT = {
	DB: D1Database
	RESEND_API_KEY?: string
	MAIL_FROM?: string
	DEV_SHOW_LINKS?: string
}

// ---------- sending the link ----------

const buildEmailHtml = (link: string): string => {
	return `<p>Here's your Keylime sign-in link. It works once, for ${LINK_MINUTES} minutes.</p><p><a href="${link}">Sign in to Keylime</a></p><p>If you didn't ask for this, ignore it.</p>`
}

const sendLinkEmail = async (env: EnvT, email: string, link: string): Promise<boolean> => {
	const canSend = Boolean(env.RESEND_API_KEY) && Boolean(env.MAIL_FROM)
	if (!canSend) return false
	const body = { from: env.MAIL_FROM, to: [email], subject: 'Your Keylime sign-in link', html: buildEmailHtml(link) }

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
		body: JSON.stringify(body)
	})

	if (!response.ok) console.error('keylime: sign-in email failed', response.status, await response.text())
	return response.ok
}

type RequestLinkResultT = { status: 'sent'; devLink?: string } | { status: 'invalid-email' } | { status: 'email-unavailable' }

export const requestLoginLink = async (env: EnvT, origin: string, rawEmail: string): Promise<RequestLinkResultT> => {
	const email = rawEmail.trim().toLowerCase()
	const isValid = EMAIL_PATTERN.test(email) && email.length <= 254
	if (!isValid) return { status: 'invalid-email' }

	// One link per minute per address. Saves email quota and
	// stops anyone from using us to spam an inbox.
	const cooldownStart = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000).toISOString()
	const recentSql = 'SELECT 1 AS found FROM login_tokens WHERE email = ? AND created_at > ? LIMIT 1'
	const recent = await env.DB.prepare(recentSql).bind(email, cooldownStart).first()
	if (recent) return { status: 'sent' }

	const token = createToken()
	const tokenHash = await hashToken(token)
	const insertSql = 'INSERT INTO login_tokens (token_hash, email, created_at, expires_at) VALUES (?, ?, ?, ?)'
	const nowText = new Date().toISOString()
	await env.DB.prepare(insertSql).bind(tokenHash, email, nowText, addMinutes(LINK_MINUTES)).run()

	// Old and used-up rows don't need to stay around.
	await env.DB.prepare('DELETE FROM login_tokens WHERE expires_at < ?').bind(nowText).run()

	const link = `${origin}/api/auth/verify?token=${token}`
	if (env.DEV_SHOW_LINKS === 'true') return { status: 'sent', devLink: link }

	const wasSent = await sendLinkEmail(env, email, link)
	if (!wasSent) return { status: 'email-unavailable' }
	return { status: 'sent' }
}

// ---------- using the link ----------

const buildCookieOptions = (url: URL, maxAgeSeconds: number) => {
	return { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: url.protocol === 'https:', maxAge: maxAgeSeconds }
}

// Takes the token and creates the session. The first sign-in for
// an email also creates the account.
export const completeLogin = async (env: EnvT, url: URL, cookies: Cookies, token: string): Promise<boolean> => {
	const tokenHash = await hashToken(token)
	const nowText = new Date().toISOString()

	// Taking the row and deleting it in one statement makes
	// the link single-use even if clicked twice at once.
	const takeSql = 'DELETE FROM login_tokens WHERE token_hash = ? AND expires_at > ? RETURNING email'
	const row = await env.DB.prepare(takeSql).bind(tokenHash, nowText).first<{ email: string }>()
	if (!row) return false

	const existingUser = await getUserByEmail(env.DB, row.email)
	const user = existingUser ?? (await createUserFromEmail(env.DB, row.email))

	const sessionToken = createToken()
	const sessionHash = await hashToken(sessionToken)
	const sessionSql = 'INSERT INTO sessions (session_hash, user_id, expires_at) VALUES (?, ?, ?)'
	const expiresAt = addMinutes(SESSION_DAYS * 24 * 60)
	await env.DB.prepare(sessionSql).bind(sessionHash, user.id, expiresAt).run()

	cookies.set(SESSION_COOKIE, sessionToken, buildCookieOptions(url, SESSION_DAYS * 24 * 60 * 60))
	return true
}

export const endSession = async (env: EnvT, url: URL, cookies: Cookies): Promise<void> => {
	const sessionToken = cookies.get(SESSION_COOKIE)

	if (sessionToken) {
		const sessionHash = await hashToken(sessionToken)
		await env.DB.prepare('DELETE FROM sessions WHERE session_hash = ?').bind(sessionHash).run()
	}

	cookies.set(SESSION_COOKIE, '', buildCookieOptions(url, 0))
}

// The signed-in user, or null. No cookie means no database read.
export const getSessionUser = async (db: D1Database, cookies: Cookies): Promise<SessionUserT | null> => {
	const sessionToken = cookies.get(SESSION_COOKIE)
	if (!sessionToken) return null
	const sessionHash = await hashToken(sessionToken)
	const nowText = new Date().toISOString()
	const sql =
		'SELECT users.id AS id, users.email AS email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.session_hash = ? AND sessions.expires_at > ?'
	const row = await db.prepare(sql).bind(sessionHash, nowText).first<SessionUserT>()
	return row ?? null
}
