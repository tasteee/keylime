import { query, mutation, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { authComponent } from './auth'

// ---------------------------------------------------------------------------
// Mapping helpers — Convex docs -> the app's `UserT` shape (id = authId,
// ISO date strings), so existing consumers keep working unchanged.
// ---------------------------------------------------------------------------

type ProfileDoc = {
	authId: string
	userName: string
	avatarUrl: string | null
	bio: string
	createdAt: number
	updatedAt: number
}

const toUserT = (doc: ProfileDoc) => ({
	id: doc.authId,
	userName: doc.userName,
	avatarUrl: doc.avatarUrl,
	bio: doc.bio,
	createdAt: new Date(doc.createdAt).toISOString(),
	updatedAt: new Date(doc.updatedAt).toISOString()
})

const findProfileByAuthId = async (ctx: QueryCtx, authId: string) => {
	return ctx.db
		.query('allUsers')
		.withIndex('by_authId', (q) => q.eq('authId', authId))
		.unique()
}

const findProfileByUserName = async (ctx: QueryCtx, userName: string) => {
	return ctx.db
		.query('allUsers')
		.withIndex('by_userName', (q) => q.eq('userName', userName))
		.unique()
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// Profile for the currently authenticated user (drives layout/dashboard `activeUser`).
export const getCurrentProfile = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) return null
		const doc = await findProfileByAuthId(ctx, identity.subject)
		return doc ? toUserT(doc) : null
	}
})

export const getById = query({
	args: { id: v.string() },
	handler: async (ctx, args) => {
		const doc = await findProfileByAuthId(ctx, args.id)
		return doc ? toUserT(doc) : null
	}
})

export const getByUserName = query({
	args: { userName: v.string() },
	handler: async (ctx, args) => {
		const doc = await findProfileByUserName(ctx, args.userName)
		return doc ? toUserT(doc) : null
	}
})

export const isUserNameAvailable = query({
	args: { userName: v.string() },
	handler: async (ctx, args) => {
		const doc = await findProfileByUserName(ctx, args.userName)
		return !doc
	}
})

export const getPublicUsers = query({
	args: {
		searchQuery: v.optional(v.string()),
		sortBy: v.optional(v.string()),
		sortOrder: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		let docs = await ctx.db.query('allUsers').collect()

		const search = args.searchQuery?.trim().toLowerCase()
		if (search) {
			docs = docs.filter((d) => {
				const inName = d.userName.toLowerCase().includes(search)
				const inBio = (d.bio ?? '').toLowerCase().includes(search)
				return inName || inBio
			})
		}

		const sortBy = args.sortBy ?? 'createdAt'
		const ascending = args.sortOrder === 'ascending'
		docs.sort((a, b) => {
			const av = (a as Record<string, unknown>)[sortBy]
			const bv = (b as Record<string, unknown>)[sortBy]
			if (av === bv) return 0
			const cmp = av! > bv! ? 1 : -1
			return ascending ? cmp : -cmp
		})

		return docs.map(toUserT)
	}
})

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

// Generate a username that isn't taken, seeded from the email local-part.
const generateUniqueUserName = async (ctx: QueryCtx, email: string, fallbackSeed: string) => {
	const base = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '') || 'user'
	const baseTaken = await findProfileByUserName(ctx, base)
	if (!baseTaken) return base

	for (let attempt = 0; attempt < 100; attempt++) {
		const candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`
		const taken = await findProfileByUserName(ctx, candidate)
		if (!taken) return candidate
	}

	return `${base}${fallbackSeed.slice(0, 8)}`
}

// Idempotently create the profile row for the authenticated user. Called by the
// client right after sign-up (replaces the old Postgres `handle_new_user` trigger).
export const ensureProfile = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) throw new Error('Not authenticated')

		const existing = await findProfileByAuthId(ctx, identity.subject)
		if (existing) return toUserT(existing)

		const authUser = await authComponent.getAuthUser(ctx)
		const email = authUser?.email ?? identity.email ?? ''
		const userName = await generateUniqueUserName(ctx, email, identity.subject)

		const now = Date.now()
		await ctx.db.insert('allUsers', {
			authId: identity.subject,
			userName,
			avatarUrl: null,
			bio: '',
			createdAt: now,
			updatedAt: now
		})

		const created = await findProfileByAuthId(ctx, identity.subject)
		return created ? toUserT(created) : null
	}
})

export const updateProfile = mutation({
	args: {
		userName: v.optional(v.string()),
		bio: v.optional(v.string()),
		avatarUrl: v.optional(v.union(v.string(), v.null()))
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) throw new Error('Not authenticated')

		const doc = await findProfileByAuthId(ctx, identity.subject)
		if (!doc) throw new Error('Profile not found')

		// Enforce username uniqueness on change.
		if (args.userName !== undefined && args.userName !== doc.userName) {
			const taken = await findProfileByUserName(ctx, args.userName)
			if (taken) throw new Error('Username is already taken')
		}

		const patch: Record<string, unknown> = { updatedAt: Date.now() }
		if (args.userName !== undefined) patch.userName = args.userName
		if (args.bio !== undefined) patch.bio = args.bio
		if (args.avatarUrl !== undefined) patch.avatarUrl = args.avatarUrl

		await ctx.db.patch(doc._id, patch)
		const updated = await ctx.db.get(doc._id)
		return updated ? toUserT(updated as unknown as ProfileDoc) : null
	}
})
