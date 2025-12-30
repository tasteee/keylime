// Notes because I dont know fuck about music theory:
// inversions: +1 would mean rotated notes up one, so the bassNote would now be the 2nd note of the chord, rather than the first. When you go up X amount of inversions as there are notes in your chord, you wind up back at the same original notes, but an octave up.
// voicings: ways to arrange chord notes, from closed (standard, close as possible) to spread wide across octaves. can be useful for eliminating mud. makes interesting sounds of same chords.

type VoicingT = 'open' | 'closed' | 'drop2' | 'drop3' | 'drop2and4' | 'spread' | 'shell' | 'tonal-lefthand' | 'tonal-triads'

// A ChordT is a wild, un-commited-to chord that the user can preview,
// modify, and optionally add to their progression if they like it.
// When a ChordT is added to a progression, it just evolves into a
// ProgressionChordT, which is a more concrete version of the chord
// that has a duration and is marked as not a rest.
// type TonalChordT = TonalChord.Chord

type ChordT = {
	id: string
	name: string
	symbol: string
	rootNote: string
	octaveOffset: number
	voicing: string
	inversion: number
	bassNote: string
}

type ProgressionChordT = ChordT & {
	type: 'chord'
	startTime: number // beats - position in progression timeline
	durationBeats: number // beats - length in progression timeline
}

type ProgressionRestT = {
	id: string
	type: 'rest'
	symbol: 'REST'
	rootNote: 'REST'
	startTime: number // beats - position in progression timeline
	durationBeats: number // beats - length in progression timeline
}

type ProgressionItemT = ProgressionChordT | ProgressionRestT

type SignalRowT = {
	id: string
	label: string
	totalIndex: number
	index: number
	octave: number
	signalIds: string[]
}

type SignalRowsT = {
	[key: string]: SignalRowT
}

type SignalT = {
	id: string
	startTime: number // beats (can be decimal, e.g., 0.25 = 1/4 beat)
	noteIndex: number
	duration: number // beats (can be decimal, e.g., 0.25 = 1/4 beat)
	octaveOffset: number
	modifiedTime?: number
}

type PerformanceNoteT = {
	id: string
	note: string
	startTime: number // ticks (milliseconds - absolute time in the performance)
	duration: number // ticks (milliseconds)
	velocity: number
	chordId: string
	signalId: string
}

type ProjectT = {
	id: string
	title: string
	description: string
	userId: string
	isPublic: boolean
	key: string
	scale: string
	octave: string
	bpm: number
	minVelocity: number
	maxVelocity: number
	progressionDurationBars: number // Derived from progressionChords total duration
	progressionChords: ProgressionItemT[] // Can be chords or rests
	chordSymbols: string[] // e.g., ['Cmaj7', 'Am7', ...] derived from progressionChords.
	patternSignals: SignalT[] // json... right? or array in supabase??
	patternSignalRows: SignalRowsT // json...
	patternDurationBars: number
	patternZoomLevel: number // between 16 - 48, steps of 4. defai;t 32
	progressionZoomLevel: number // between 40 and 160, steps of 12, default 82
	createdAt: Date
	updatedAt: Date
}

type MoveSignalToRowOptionsT = {
	fromRowId: string
	toRowId: string
	signalId: string
}

type JsonT = string | number | boolean | null | { [key: string]: JsonT | undefined } | JsonT[]

type UserT = {
	id: string
	userName: string
	avatarUrl: string | null
	bio: string
	createdAt: Date
	updatedAt: Date
}

type AuthUserT = {
	id: string
	email: string | null
	bannedUntil: string | null
	createdAt: string
	confirmedAt: string | null
	confirmationSentAt: string | null
	isAnonymous: boolean
	isSsoUser: boolean
	invitedAt: string | null
	lastSignInAt: string | null
	phone: string | null
	rawAppMetaData: {
		provider: string
		providers: string[]
	}
	rawUserMetaData: {
		email_verified: boolean
		[key: string]: JsonT
	}
	updatedAt: string
	providers: string[]
}

// Supabase Database Types
type DatabaseAllUsersTableRowT = {
	id: string
	userName: string
	avatarUrl: string | null
	bio: string
	createdAt: string
	updatedAt: string
}

type DatabaseAllProjectsTableRowT = {
	id: string
	title: string
	description: string
	userId: string
	isPublic: boolean
	key: string
	scale: string
	octave: number
	bpm: number
	minVelocity: number
	maxVelocity: number
	progressionChords: JsonT
	chordSymbols: string[]
	patternSignals: JsonT
	patternSignalRows: JsonT
	patternDurationBars: number
	createdAt: string
	updatedAt: string
}

type DatabaseProjectFavoritesTableRowT = {
	id: string
	userId: string
	projectId: string
	createdAt: string
}

type DatabaseT = {
	public: {
		Tables: {
			all_users: {
				Row: DatabaseAllUsersTableRowT
				Insert: Omit<DatabaseAllUsersTableRowT, 'createdAt' | 'updatedAt'> & {
					createdAt?: string
					updatedAt?: string
				}
				Update: Partial<DatabaseAllUsersTableRowT>
			}
			all_projects: {
				Row: DatabaseAllProjectsTableRowT
				Insert: Omit<DatabaseAllProjectsTableRowT, 'id' | 'createdAt' | 'updatedAt'> & {
					id?: string
					createdAt?: string
					updatedAt?: string
				}
				Update: Partial<DatabaseAllProjectsTableRowT>
			}
			project_favorites: {
				Row: DatabaseProjectFavoritesTableRowT
				Insert: Omit<DatabaseProjectFavoritesTableRowT, 'id' | 'createdAt'> & {
					id?: string
					createdAt?: string
				}
				Update: Partial<DatabaseProjectFavoritesTableRowT>
			}
		}
		Views: {}
		Functions: {}
		Enums: {}
	}
}

type PlaybackContextT = {
	state: PlaybackStateT
	load: () => Promise<void>
	playNote: (args: PlayNoteArgsT) => Promise<void>
	playChord: (chord: ChordT, octave: string, durationMs?: number) => Promise<void>
	stopNote: (args: PlayNoteArgsT) => void
	stopChord: (chord: ChordT) => void
	perform: (project: PerformProjectArgsT) => Promise<void>
	update: (project: PerformProjectArgsT) => void
	stop: () => void
	pausePerformance: () => void
	stopPerformance: () => void
}
