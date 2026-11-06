// Projects saved before Keylime moved onto @tasteee/scaled keep chords in an
// older shape: voicing names from the tonal era, plus rootNote, name and
// bassNote on every chord. This turns them into the shape scaled understands.
//
// Projects are converted when they are loaded, then saved back right away
// (see database/index.ts), so each project is converted once.
import { scaled, isVoicingAvailable, DEFAULT_VOICING } from '$lib/music'

// 1 = original shape, 2 = scaled shape. Mirrors D1's projects.dataVersion.
export const CURRENT_DATA_VERSION = 2

// Old voicing names to scaled voicing names. The two tonal dictionary voicings
// searched for a nice arrangement, which is what Dynamic does now.
const OLD_VOICINGS: Record<string, VoicingT> = {
	closed: 'closed',
	open: 'open',
	drop2: 'drop2',
	drop3: 'drop3',
	drop2and4: 'drop2and4',
	spread: 'spread',
	shell: 'shell',
	'tonal-lefthand': 'dynamic',
	'tonal-triads': 'dynamic'
}

type OldItemT = {
	id: string
	type?: 'chord' | 'rest'
	symbol?: string
	name?: string
	octaveOffset?: number
	voicing?: string
	inversion?: number
	startTime?: number
	durationBeats: number
}

// The chord symbol scaled uses for an old chord, or null if scaled doesn't know it.
const getScaledSymbol = (item: OldItemT): string | null => {
	const candidates = [item.symbol, item.name].filter((text): text is string => Boolean(text))
	for (const candidate of candidates) {
		try {
			return scaled.getChord({ chord: candidate }).symbol
		} catch {
			continue
		}
	}
	return null
}

const toRest = (item: OldItemT): ProgressionRestT => {
	return { id: item.id, type: 'rest', symbol: 'REST', startTime: item.startTime ?? 0, durationBeats: item.durationBeats }
}

const migrateItem = (item: OldItemT): ProgressionItemT => {
	const isRest = item.type === 'rest'
	if (isRest) return toRest(item)

	const symbol = getScaledSymbol(item)
	if (!symbol) {
		// A chord scaled can't read becomes a rest, so the timing of the rest of the progression holds.
		console.warn(`migrateProject: unknown chord "${item.symbol ?? item.name}", replaced with a rest`)
		return toRest(item)
	}

	const oldVoicing = OLD_VOICINGS[item.voicing ?? 'closed'] ?? DEFAULT_VOICING
	const voicing = isVoicingAvailable(symbol, oldVoicing) ? oldVoicing : DEFAULT_VOICING

	return {
		id: item.id,
		type: 'chord',
		symbol,
		octaveOffset: Number(item.octaveOffset) || 0,
		voicing,
		inversion: Number(item.inversion) || 0,
		startTime: item.startTime ?? 0,
		durationBeats: item.durationBeats
	}
}

const parseItems = (value: unknown): OldItemT[] => {
	if (typeof value === 'string') return JSON.parse(value) as OldItemT[]
	return Array.isArray(value) ? (value as OldItemT[]) : []
}

export const isCurrentProject = (project: Pick<ProjectT, 'dataVersion'>): boolean => {
	return (project.dataVersion ?? 1) >= CURRENT_DATA_VERSION
}

export const migrateProject = (project: ProjectT): ProjectT => {
	if (isCurrentProject(project)) return project

	const progressionChords = parseItems(project.progressionChords).map(migrateItem)
	const chordSymbols = [...new Set(progressionChords.filter((item) => item.type === 'chord').map((item) => item.symbol))]

	return {
		...project,
		octave: Number(project.octave) || 3,
		progressionChords,
		chordSymbols,
		dataVersion: CURRENT_DATA_VERSION
	}
}
