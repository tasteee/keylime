import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Application data tables. Authentication (users, accounts, sessions) is stored
// separately inside the Better Auth component, so these only hold app-specific
// data. Both tables link to the Better Auth user id via `authId` / `userId`,
// which is the string the app has always used as the user's id.
export default defineSchema({
	// User profiles. `authId` is the Better Auth user id and is what the rest of
	// the app treats as `user.id`. Mirrors the old Supabase `all_users` table.
	allUsers: defineTable({
		authId: v.string(),
		userName: v.string(),
		avatarUrl: v.union(v.string(), v.null()),
		bio: v.string(),
		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index('by_authId', ['authId'])
		.index('by_userName', ['userName']),

	// Projects. `id` is the client-generated uuid the app uses as the project key
	// (for load/save/delete/clone); `userId` is the owner's Better Auth user id.
	// Mirrors the old Supabase `all_projects` table.
	allProjects: defineTable({
		id: v.string(),
		userId: v.string(),
		title: v.string(),
		description: v.string(),
		isPublic: v.boolean(),
		key: v.string(),
		scale: v.string(),
		octave: v.string(),
		bpm: v.number(),
		minVelocity: v.number(),
		maxVelocity: v.number(),
		patternDurationBars: v.number(),
		patternZoomLevel: v.optional(v.number()),
		progressionZoomLevel: v.optional(v.number()),
		progressionDurationBars: v.optional(v.number()),
		originalProjectId: v.optional(v.union(v.string(), v.null())),
		// JSON blobs — kept loose to match the app's runtime shapes.
		chordSymbols: v.array(v.string()),
		progressionChords: v.any(),
		patternSignals: v.any(),
		patternSignalRows: v.any(),
		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index('by_id', ['id'])
		.index('by_userId', ['userId'])
		.index('by_isPublic', ['isPublic'])
})
