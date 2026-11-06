import type { D1Database } from '@cloudflare/workers-types'

// Every query the app makes. Routes and page loads call these
// with env.DB. Owner checks live here, in the WHERE clauses.
// Dates leave as ISO text, JSON columns leave parsed.

const USER_NAME_PATTERN = /^[a-zA-Z0-9_-]{2,32}$/
const MAX_JSON_CHARS = 1_000_000
const PAGE_LIMIT_MAX = 100

const nowText = (): string => new Date().toISOString()

// ---------- users ----------

const USER_COLUMNS = 'id, userName, avatarUrl, bio, createdAt, updatedAt'

export const getUserById = async (db: D1Database, id: string): Promise<UserT | null> => {
	const sql = `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`
	const row = await db.prepare(sql).bind(id).first()
	return (row as unknown as UserT) ?? null
}

export const getUserByUserName = async (db: D1Database, userName: string): Promise<UserT | null> => {
	const sql = `SELECT ${USER_COLUMNS} FROM users WHERE userName = ? COLLATE NOCASE`
	const row = await db.prepare(sql).bind(userName).first()
	return (row as unknown as UserT) ?? null
}

export const getUserByEmail = async (db: D1Database, email: string): Promise<UserT | null> => {
	const sql = `SELECT ${USER_COLUMNS} FROM users WHERE email = ?`
	const row = await db.prepare(sql).bind(email).first()
	return (row as unknown as UserT) ?? null
}

const makeBaseUserName = (email: string): string => {
	const localPart = email.split('@')[0] ?? ''
	const cleaned = localPart.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)
	return cleaned.length >= 2 ? cleaned : `user${cleaned}`
}

const checkUserNameTaken = async (db: D1Database, userName: string): Promise<boolean> => {
	const sql = 'SELECT 1 AS found FROM users WHERE userName = ? COLLATE NOCASE LIMIT 1'
	const row = await db.prepare(sql).bind(userName).first()
	return Boolean(row)
}

// First sign-in for an email. Picks a free username from the email.
export const createUserFromEmail = async (db: D1Database, email: string): Promise<UserT> => {
	const baseName = makeBaseUserName(email)
	let userName = baseName

	for (let attempt = 0; attempt < 20; attempt++) {
		const isTaken = await checkUserNameTaken(db, userName)
		if (!isTaken) break
		const randomDigits = Math.floor(1000 + Math.random() * 9000)
		userName = `${baseName}${randomDigits}`
	}

	const id = crypto.randomUUID()
	const stamp = nowText()
	const insertSql = 'INSERT INTO users (id, email, userName, bio, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
	await db.prepare(insertSql).bind(id, email, userName, '', stamp, stamp).run()
	return (await getUserById(db, id)) as UserT
}

type UpdateProfileInputT = { userName?: string; bio?: string; avatarUrl?: string }
type UpdateProfileResultT = { error: 'invalid-username' | 'username-taken' | null }

export const updateUserProfile = async (db: D1Database, userId: string, input: UpdateProfileInputT): Promise<UpdateProfileResultT> => {
	const current = await getUserById(db, userId)
	if (!current) return { error: 'invalid-username' }

	const userName = input.userName?.trim() ?? current.userName
	const isNameValid = USER_NAME_PATTERN.test(userName)
	if (!isNameValid) return { error: 'invalid-username' }

	const isNameChanged = userName.toLowerCase() !== current.userName.toLowerCase()
	if (isNameChanged && (await checkUserNameTaken(db, userName))) return { error: 'username-taken' }

	const bio = input.bio !== undefined ? String(input.bio).slice(0, 500) : current.bio
	const avatarUrl = input.avatarUrl !== undefined ? String(input.avatarUrl).slice(0, 500) || null : current.avatarUrl
	const sql = 'UPDATE users SET userName = ?, bio = ?, avatarUrl = ?, updatedAt = ? WHERE id = ?'
	await db.prepare(sql).bind(userName, bio, avatarUrl, nowText(), userId).run()
	return { error: null }
}

type ListUsersOptionsT = {
	sortBy?: 'updatedAt' | 'createdAt' | 'userName'
	sortOrder?: 'ascending' | 'descending'
	searchQuery?: string
}

const escapeLike = (text: string): string => text.replace(/[\\%_]/g, (char) => `\\${char}`)

export const listUsers = async (db: D1Database, options: ListUsersOptionsT): Promise<UserT[]> => {
	const sortColumns = ['updatedAt', 'createdAt', 'userName']
	const sortBy = sortColumns.includes(options.sortBy ?? '') ? options.sortBy : 'createdAt'
	const direction = options.sortOrder === 'ascending' ? 'ASC' : 'DESC'
	const binds: string[] = []
	let where = ''

	if (options.searchQuery) {
		const pattern = `%${escapeLike(options.searchQuery)}%`
		where = "WHERE userName LIKE ? ESCAPE '\\' OR bio LIKE ? ESCAPE '\\'"
		binds.push(pattern, pattern)
	}

	const sql = `SELECT ${USER_COLUMNS} FROM users ${where} ORDER BY ${sortBy} ${direction} LIMIT 200`
	const result = await db.prepare(sql).bind(...binds).all()
	return result.results as unknown as UserT[]
}

// ---------- projects ----------

type ProjectRowT = Record<string, unknown>

const parseJson = <T>(text: unknown, fallback: T): T => {
	try {
		return JSON.parse(String(text)) as T
	} catch {
		return fallback
	}
}

const projectFromRow = (row: ProjectRowT): ProjectT => {
	const { _userName, _avatarUrl, ...rest } = row
	const project = {
		...rest,
		isPublic: Boolean(rest.isPublic),
		doesPatternResetOnChordChange: Boolean(rest.doesPatternResetOnChordChange),
		octave: String(rest.octave),
		progressionChords: parseJson(rest.progressionChords, []),
		chordSymbols: parseJson(rest.chordSymbols, []),
		patternSignals: parseJson(rest.patternSignals, []),
		patternSignalRows: parseJson(rest.patternSignalRows, {})
	} as Record<string, unknown>

	const hasUser = _userName !== undefined
	if (hasUser) project.user = { userName: _userName, avatarUrl: _avatarUrl ?? null }
	return project as unknown as ProjectT
}

const PROJECT_WITH_USER_SELECT = 'SELECT p.*, u.userName AS _userName, u.avatarUrl AS _avatarUrl FROM projects p JOIN users u ON u.id = p.userId'

// A project is visible to its owner and, when public, to everyone.
export const getProjectById = async (db: D1Database, id: string, viewerId: string | null): Promise<ProjectT | null> => {
	const sql = 'SELECT * FROM projects WHERE id = ? AND (isPublic = 1 OR userId = ?)'
	const row = await db.prepare(sql).bind(id, viewerId ?? '').first<ProjectRowT>()
	return row ? projectFromRow(row) : null
}

type PageT = { limit?: number; offset?: number }

const clampPage = (page: PageT) => {
	const limit = Math.min(Math.max(Math.floor(page.limit ?? 20), 1), PAGE_LIMIT_MAX)
	const offset = Math.max(Math.floor(page.offset ?? 0), 0)
	return { limit, offset }
}

export const listProjectsByUser = async (db: D1Database, userId: string, page: PageT = {}) => {
	const { limit, offset } = clampPage(page)
	const listSql = 'SELECT * FROM projects WHERE userId = ? ORDER BY updatedAt DESC LIMIT ? OFFSET ?'
	const countSql = 'SELECT COUNT(*) AS total FROM projects WHERE userId = ?'
	const [listResult, countRow] = await db.batch([db.prepare(listSql).bind(userId, limit, offset), db.prepare(countSql).bind(userId)])
	const data = (listResult.results as ProjectRowT[]).map(projectFromRow)
	const totalCount = Number((countRow.results[0] as { total: number }).total)
	return { data, totalCount }
}

type PublicProjectsOptionsT = {
	sortBy?: 'updatedAt' | 'createdAt' | 'title' | 'scale' | 'bpm' | 'userName'
	sortOrder?: 'ascending' | 'descending'
	key?: string
	scale?: string
	minBpm?: number
	maxBpm?: number
	searchQuery?: string
	chordSymbols?: string[]
	chordMatchMode?: 'all' | 'any'
	userName?: string
} & PageT

const SORT_COLUMNS: Record<string, string> = {
	updatedAt: 'p.updatedAt',
	createdAt: 'p.createdAt',
	title: 'p.title COLLATE NOCASE',
	scale: 'p.scale',
	bpm: 'p.bpm',
	userName: 'u.userName COLLATE NOCASE'
}

const buildPublicFilter = (options: PublicProjectsOptionsT) => {
	const clauses = ['p.isPublic = 1']
	const binds: (string | number)[] = []

	if (options.key) {
		clauses.push('p.key = ?')
		binds.push(options.key)
	}
	if (options.scale) {
		clauses.push('p.scale = ?')
		binds.push(options.scale)
	}
	if (options.minBpm !== undefined) {
		clauses.push('p.bpm >= ?')
		binds.push(options.minBpm)
	}
	if (options.maxBpm !== undefined) {
		clauses.push('p.bpm <= ?')
		binds.push(options.maxBpm)
	}
	if (options.userName) {
		clauses.push('u.userName = ? COLLATE NOCASE')
		binds.push(options.userName)
	}
	if (options.searchQuery) {
		const pattern = `%${escapeLike(options.searchQuery)}%`
		clauses.push("(p.title LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')")
		binds.push(pattern, pattern)
	}

	const symbols = [...new Set(options.chordSymbols ?? [])].slice(0, 50)
	if (symbols.length > 0) {
		const marks = symbols.map(() => '?').join(', ')
		const matchSql = `SELECT COUNT(DISTINCT value) FROM json_each(p.chordSymbols) WHERE value IN (${marks})`
		const isMatchAll = options.chordMatchMode === 'all'
		clauses.push(isMatchAll ? `(${matchSql}) = ${symbols.length}` : `(${matchSql}) > 0`)
		binds.push(...symbols)
	}

	return { where: clauses.join(' AND '), binds }
}

export const listPublicProjects = async (db: D1Database, options: PublicProjectsOptionsT = {}) => {
	const { limit, offset } = clampPage(options)
	const { where, binds } = buildPublicFilter(options)
	const sortColumn = SORT_COLUMNS[options.sortBy ?? 'updatedAt'] ?? SORT_COLUMNS.updatedAt
	const direction = options.sortOrder === 'ascending' ? 'ASC' : 'DESC'

	const listSql = `${PROJECT_WITH_USER_SELECT} WHERE ${where} ORDER BY ${sortColumn} ${direction} LIMIT ? OFFSET ?`
	const countSql = `SELECT COUNT(*) AS total FROM projects p JOIN users u ON u.id = p.userId WHERE ${where}`
	const [listResult, countRow] = await db.batch([db.prepare(listSql).bind(...binds, limit, offset), db.prepare(countSql).bind(...binds)])
	const data = (listResult.results as ProjectRowT[]).map(projectFromRow)
	const totalCount = Number((countRow.results[0] as { total: number }).total)
	return { data, totalCount }
}

// ---------- saving ----------

const text = (value: unknown, fallback: string, maxLength: number): string => {
	return typeof value === 'string' ? value.slice(0, maxLength) : fallback
}

const int = (value: unknown, fallback: number): number => {
	const number = Number(value)
	return Number.isFinite(number) ? Math.round(number) : fallback
}

// Pattern length is a number of bars from 1/16 up to 16, in steps of 1/16.
const MIN_PATTERN_BARS = 1 / 16
const MAX_PATTERN_BARS = 16

const patternBars = (value: unknown, fallback: number): number => {
	const number = Number(value)
	if (!Number.isFinite(number)) return fallback
	const inSixteenths = Math.round(number * 16) / 16
	return Math.min(MAX_PATTERN_BARS, Math.max(MIN_PATTERN_BARS, inSixteenths))
}

const jsonText = (value: unknown, fallback: unknown): string | null => {
	const output = JSON.stringify(value ?? fallback)
	return output.length <= MAX_JSON_CHARS ? output : null
}

type SaveResultT = { project: ProjectT; error: null } | { project: null; error: 'invalid' | 'forbidden' }

// Creates the project, or updates it when it's the caller's own.
// An id that belongs to someone else is refused. Keeps createdAt.
export const saveProject = async (db: D1Database, userId: string, input: Partial<ProjectT>): Promise<SaveResultT> => {
	const id = typeof input.id === 'string' && input.id.length > 0 ? input.id : crypto.randomUUID()
	const progressionChords = jsonText(input.progressionChords, [])
	const chordSymbols = jsonText(input.chordSymbols, [])
	const patternSignals = jsonText(input.patternSignals, [])
	const patternSignalRows = jsonText(input.patternSignalRows, {})
	const hasOversizedJson = [progressionChords, chordSymbols, patternSignals, patternSignalRows].includes(null)
	if (hasOversizedJson) return { project: null, error: 'invalid' }

	const stamp = nowText()
	const createdAt = typeof input.createdAt === 'string' || input.createdAt instanceof Date ? new Date(input.createdAt).toISOString() : stamp
	const values = [
		id,
		text(input.title, 'New Project', 200),
		text(input.description, '', 2000),
		userId,
		input.isPublic ? 1 : 0,
		text(input.key, 'C', 8),
		text(input.scale, 'Major', 64),
		String(input.octave ?? '3').slice(0, 2),
		int(input.bpm, 120),
		int(input.minVelocity, 60),
		int(input.maxVelocity, 100),
		progressionChords,
		Number(input.progressionDurationBars) || 0,
		chordSymbols,
		patternSignals,
		patternSignalRows,
		patternBars(input.patternDurationBars, 1),
		input.doesPatternResetOnChordChange ? 1 : 0,
		int(input.patternZoomLevel, 32),
		int(input.progressionZoomLevel, 82),
		Number.isNaN(Date.parse(createdAt)) ? stamp : createdAt,
		stamp
	]

	const sql = `INSERT INTO projects (id, title, description, userId, isPublic, key, scale, octave, bpm, minVelocity, maxVelocity,
			progressionChords, progressionDurationBars, chordSymbols, patternSignals, patternSignalRows,
			patternDurationBars, doesPatternResetOnChordChange, patternZoomLevel, progressionZoomLevel, createdAt, updatedAt)
		VALUES (${values.map(() => '?').join(', ')})
		ON CONFLICT (id) DO UPDATE SET
			title = excluded.title, description = excluded.description, isPublic = excluded.isPublic,
			key = excluded.key, scale = excluded.scale, octave = excluded.octave, bpm = excluded.bpm,
			minVelocity = excluded.minVelocity, maxVelocity = excluded.maxVelocity,
			progressionChords = excluded.progressionChords, progressionDurationBars = excluded.progressionDurationBars,
			chordSymbols = excluded.chordSymbols, patternSignals = excluded.patternSignals,
			patternSignalRows = excluded.patternSignalRows, patternDurationBars = excluded.patternDurationBars,
			doesPatternResetOnChordChange = excluded.doesPatternResetOnChordChange,
			patternZoomLevel = excluded.patternZoomLevel, progressionZoomLevel = excluded.progressionZoomLevel,
			updatedAt = excluded.updatedAt
		WHERE projects.userId = excluded.userId`

	const result = await db.prepare(sql).bind(...values).run()
	const didWrite = (result.meta.changes ?? 0) > 0
	if (!didWrite) return { project: null, error: 'forbidden' }

	const project = await getProjectById(db, id, userId)
	return { project: project as ProjectT, error: null }
}

export const deleteProject = async (db: D1Database, userId: string, id: string): Promise<boolean> => {
	const result = await db.prepare('DELETE FROM projects WHERE id = ? AND userId = ?').bind(id, userId).run()
	return (result.meta.changes ?? 0) > 0
}

export const cloneProject = async (db: D1Database, userId: string, id: string): Promise<ProjectT | null> => {
	const source = await getProjectById(db, id, userId)
	if (!source) return null
	const { user: _user, ...rest } = source as ProjectT & { user?: unknown }
	const copy = { ...rest, id: crypto.randomUUID(), title: `${source.title} (Clone)`, isPublic: false, createdAt: undefined }
	const result = await saveProject(db, userId, copy as unknown as Partial<ProjectT>)
	return result.project
}
