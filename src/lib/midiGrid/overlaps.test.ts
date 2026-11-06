import { describe, expect, it } from 'vitest'
import { resolveOverlaps } from './overlaps'
import type { NoteT } from './types'

let nextId = 0
const createId = () => `split-${nextId++}`

const makeNote = (id: string, start: number, duration: number, pitch = 5): NoteT => ({
	id,
	pitch,
	start,
	duration,
	velocity: 0.8,
	isMuted: false,
	modifiedTime: 0
})

describe('resolveOverlaps', () => {
	it('leaves notes alone when nothing overlaps', () => {
		const notes = [makeNote('a', 0, 240), makeNote('b', 240, 240)]
		const result = resolveOverlaps({ notes, winnerIds: new Set(['b']), createId })
		expect(result).toEqual(notes)
	})

	it('cuts the tail of an older note when a new note starts inside it', () => {
		const notes = [makeNote('old', 0, 960), makeNote('new', 480, 240)]
		const result = resolveOverlaps({ notes, winnerIds: new Set(['new']), createId })
		const old = result.find((note) => note.id === 'old')
		expect(old?.duration).toBe(480)
	})

	it('pushes the start of an older note past a new note that covers its start', () => {
		const notes = [makeNote('old', 240, 960), makeNote('new', 0, 480)]
		const result = resolveOverlaps({ notes, winnerIds: new Set(['new']), createId })
		const old = result.find((note) => note.id === 'old')
		expect(old?.start).toBe(480)
		expect(old?.duration).toBe(720)
	})

	it('splits an older note that a new note lands in the middle of', () => {
		const notes = [makeNote('old', 0, 960), makeNote('new', 240, 240)]
		const result = resolveOverlaps({ notes, winnerIds: new Set(['new']), createId })
		const pieces = result.filter((note) => note.id !== 'new').sort((a, b) => a.start - b.start)
		expect(pieces.map((note) => [note.start, note.duration])).toEqual([
			[0, 240],
			[480, 480]
		])
	})

	it('removes an older note that is fully covered', () => {
		const notes = [makeNote('old', 240, 240), makeNote('new', 0, 960)]
		const result = resolveOverlaps({ notes, winnerIds: new Set(['new']), createId })
		expect(result.map((note) => note.id)).toEqual(['new'])
	})

	it('ignores notes in other rows', () => {
		const notes = [makeNote('old', 0, 960, 3), makeNote('new', 0, 960, 4)]
		const result = resolveOverlaps({ notes, winnerIds: new Set(['new']), createId })
		expect(result).toEqual(notes)
	})
})
