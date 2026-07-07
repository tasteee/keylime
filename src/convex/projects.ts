import { query, mutation, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toMs = (value: unknown): number => {
	if (typeof value === 'number') return value
	if (value instanceof Date) return value.getTime()
	if (typeof value === 'string') {
		const parsed = Date.parse(value)
		if (!Number.isNaN(parsed)) return parsed
	}
	return Date.now()
}

// The persisted columns, derived from the app's `ProjectT`. Anything else on the
// incoming object (e.g. derived fields) is dropped.
const normalizeProject = (input: Record<string, any>, ownerId: string) => ({
	id: String(input.id),
	userId: ownerId,
	title: input.title ?? 'New Project',
	description: input.description ?? '',
	isPublic: !!input.isPublic,
	key: input.key ?? 'C',
	scale: input.scale ?? 'Major',
	octave: String(input.octave ?? '3'),
	bpm: Number(input.bpm ?? 120),
	minVelocity: Number(input.minVelocity ?? 60),
	maxVelocity: Number(input.maxVelocity ?? 100),
	patternDurationBars: Number(input.patternDurationBars ?? 1),
	patternZoomLevel: input.patternZoomLevel ?? 32,
	progressionZoomLevel: input.progressionZoomLevel ?? 82,
	progressionDurationBars: input.progressionDurationBars ?? 0,
	originalProjectId: input.originalProjectId ?? null,
	chordSymbols: Array.isArray(input.chordSymbols) ? input.chordSymbols : [],
	progressionChords: input.progressionChords ?? [],
	patternSignals: input.patternSignals ?? [],
	patternSignalRows: input.patternSignalRows ?? {},
	createdAt: toMs(input.createdAt),
	updatedAt: toMs(input.updatedAt)
})

// Convex doc -> the app's `ProjectT` shape (ISO date strings, no `_id`).
const toProjectT = (doc: Record<string, any>) => {
	const { _id, _creationTime, createdAt, updatedAt, ...rest } = doc
	return {
		...rest,
		createdAt: new Date(createdAt).toISOString(),
		updatedAt: new Date(updatedAt).toISOString()
	}
}

const findByProjectId = async (ctx: QueryCtx, id: string) => {
	return ctx.db
		.query('allProjects')
		.withIndex('by_projectId', (q) => q.eq('id', id))
		.unique()
}

const findProfile = async (ctx: QueryCtx, authId: string) => {
	return ctx.db
		.query('allUsers')
		.withIndex('by_authId', (q) => q.eq('authId', authId))
		.unique()
}

// Attach `{ user: { userName, avatarUrl } }` to a project (the old Supabase join).
const withUser = async (ctx: QueryCtx, doc: Record<string, any>) => {
	const profile = await findProfile(ctx, doc.userId)
	return {
		...toProjectT(doc),
		user: profile ? { userName: profile.userName, avatarUrl: profile.avatarUrl } : null
	}
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// A single project by its app id. Visible if public, or owned by the caller.
export const getById = query({
	args: { id: v.string() },
	handler: async (ctx, args) => {
		const doc = await findByProjectId(ctx, args.id)
		if (!doc) return null
		if (doc.isPublic) return toProjectT(doc)

		const identity = await ctx.auth.getUserIdentity()
		if (identity && identity.subject === doc.userId) return toProjectT(doc)
		return null
	}
})

// Projects for a given user. Returns all of them to the owner, but only the
// public ones to anyone else (mirrors the old RLS select policy).
export const getByUserId = query({
	args: {
		userId: v.string(),
		limit: v.optional(v.number()),
		offset: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		const isOwner = !!identity && identity.subject === args.userId

		let docs = await ctx.db
			.query('allProjects')
			.withIndex('by_userId', (q) => q.eq('userId', args.userId))
			.collect()

		if (!isOwner) docs = docs.filter((d) => d.isPublic)
		docs.sort((a, b) => b.updatedAt - a.updatedAt)

		const totalCount = docs.length
		const offset = args.offset ?? 0
		const limit = args.limit ?? 20
		const page = docs.slice(offset, offset + limit)

		return { data: page.map(toProjectT), totalCount }
	}
})

// Public projects for a username (with the user join).
export const getPublicByUserName = query({
	args: { userName: v.string() },
	handler: async (ctx, args) => {
		const profile = await ctx.db
			.query('allUsers')
			.withIndex('by_userName', (q) => q.eq('userName', args.userName))
			.unique()
		if (!profile) return []

		const docs = await ctx.db
			.query('allProjects')
			.withIndex('by_userId', (q) => q.eq('userId', profile.authId))
			.collect()

		const publicDocs = docs.filter((d) => d.isPublic).sort((a, b) => b.updatedAt - a.updatedAt)
		return Promise.all(publicDocs.map((d) => withUser(ctx, d)))
	}
})

// Filtered/sorted/paginated public projects for the browse page.
export const getPublic = query({
	args: {
		sortBy: v.optional(v.string()),
		sortOrder: v.optional(v.string()),
		key: v.optional(v.string()),
		scale: v.optional(v.string()),
		minBpm: v.optional(v.number()),
		maxBpm: v.optional(v.number()),
		searchQuery: v.optional(v.string()),
		chordSymbols: v.optional(v.array(v.string())),
		chordMatchMode: v.optional(v.string()),
		limit: v.optional(v.number()),
		offset: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		let docs = await ctx.db
			.query('allProjects')
			.withIndex('by_isPublic', (q) => q.eq('isPublic', true))
			.collect()

		if (args.key) docs = docs.filter((d) => d.key === args.key)
		if (args.scale) docs = docs.filter((d) => d.scale === args.scale)
		if (args.minBpm !== undefined) docs = docs.filter((d) => d.bpm >= args.minBpm!)
		if (args.maxBpm !== undefined) docs = docs.filter((d) => d.bpm <= args.maxBpm!)

		const search = args.searchQuery?.trim().toLowerCase()
		if (search) {
			docs = docs.filter((d) => {
				const inTitle = (d.title ?? '').toLowerCase().includes(search)
				const inDesc = (d.description ?? '').toLowerCase().includes(search)
				return inTitle || inDesc
			})
		}

		const chords = args.chordSymbols
		if (chords && chords.length > 0) {
			const matchAll = args.chordMatchMode === 'all'
			docs = docs.filter((d) => {
				const owned: string[] = Array.isArray(d.chordSymbols) ? d.chordSymbols : []
				return matchAll ? chords.every((c) => owned.includes(c)) : chords.some((c) => owned.includes(c))
			})
		}

		const totalCount = docs.length

		const sortBy = args.sortBy ?? 'updatedAt'
		const ascending = args.sortOrder === 'ascending'
		docs.sort((a, b) => {
			const av = (a as Record<string, unknown>)[sortBy]
			const bv = (b as Record<string, unknown>)[sortBy]
			if (av === bv) return 0
			const cmp = (av as any) > (bv as any) ? 1 : -1
			return ascending ? cmp : -cmp
		})

		const offset = args.offset ?? 0
		const limit = args.limit ?? 20
		const page = docs.slice(offset, offset + limit)

		const data = await Promise.all(page.map((d) => withUser(ctx, d)))
		return { data, totalCount }
	}
})

// ---------------------------------------------------------------------------
// Mutations (owner-enforced — this is what replaces the RLS write policies)
// ---------------------------------------------------------------------------

const requireIdentity = async (ctx: QueryCtx) => {
	const identity = await ctx.auth.getUserIdentity()
	if (!identity) throw new Error('Not authenticated')
	return identity
}

// Insert-or-update by app id. The caller always becomes/stays the owner; you
// cannot overwrite someone else's project.
export const save = mutation({
	args: { project: v.any() },
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx)
		const existing = await findByProjectId(ctx, String(args.project.id))

		if (existing) {
			if (existing.userId !== identity.subject) throw new Error('Not authorized to modify this project')
			const normalized = normalizeProject(args.project, identity.subject)
			// Preserve original createdAt on update.
			await ctx.db.patch(existing._id, { ...normalized, createdAt: existing.createdAt, updatedAt: Date.now() })
			const updated = await ctx.db.get(existing._id)
			return toProjectT(updated as Record<string, any>)
		}

		const normalized = normalizeProject(args.project, identity.subject)
		const _id = await ctx.db.insert('allProjects', normalized)
		const created = await ctx.db.get(_id)
		return toProjectT(created as Record<string, any>)
	}
})

// Insert a new project (fails if the id already exists). Used for clones.
export const add = mutation({
	args: { project: v.any() },
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx)
		const existing = await findByProjectId(ctx, String(args.project.id))
		if (existing) throw new Error('A project with this id already exists')

		const normalized = normalizeProject(args.project, identity.subject)
		const _id = await ctx.db.insert('allProjects', normalized)
		const created = await ctx.db.get(_id)
		return toProjectT(created as Record<string, any>)
	}
})

export const remove = mutation({
	args: { id: v.string() },
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx)
		const existing = await findByProjectId(ctx, args.id)
		if (!existing) return { didSucceed: true }
		if (existing.userId !== identity.subject) throw new Error('Not authorized to delete this project')
		await ctx.db.delete(existing._id)
		return { didSucceed: true }
	}
})
