import { MIN_NOTE_TICKS } from './constants'
import type { NoteT } from './types'

type ResolveOverlapsArgsT = {
	notes: NoteT[]
	// The notes that were just added or changed. They keep their place.
	winnerIds: ReadonlySet<string>
	createId: () => string
}

const getEndTick = (note: NoteT): number => note.start + note.duration

const checkDoOverlap = (noteA: NoteT, noteB: NoteT): boolean => {
	const doesAStartBeforeBEnds = noteA.start < getEndTick(noteB)
	const doesBStartBeforeAEnds = noteB.start < getEndTick(noteA)
	return doesAStartBeforeBEnds && doesBStartBeforeAEnds
}

type CarveArgsT = {
	loser: NoteT
	winner: NoteT
	createId: () => string
}

// What is left of a note after another note lands on top of it.
const carveNote = (args: CarveArgsT): NoteT[] => {
	const loser = args.loser
	const winner = args.winner
	const winnerEnd = getEndTick(winner)
	const loserEnd = getEndTick(loser)

	const startsBeforeWinner = loser.start < winner.start
	const endsAfterWinner = loserEnd > winnerEnd

	const leftDuration = winner.start - loser.start
	const rightDuration = loserEnd - winnerEnd
	const isLeftPieceUsable = leftDuration >= MIN_NOTE_TICKS
	const isRightPieceUsable = rightDuration >= MIN_NOTE_TICKS

	const leftPiece: NoteT = { ...loser, duration: leftDuration }
	const rightPiece: NoteT = { ...loser, start: winnerEnd, duration: rightDuration }

	if (startsBeforeWinner && endsAfterWinner) {
		const rightSplit: NoteT = { ...rightPiece, id: args.createId() }
		const pieces: NoteT[] = []
		if (isLeftPieceUsable) pieces.push(leftPiece)
		if (isRightPieceUsable) pieces.push(rightSplit)
		return pieces
	}

	if (startsBeforeWinner) return isLeftPieceUsable ? [leftPiece] : []
	if (endsAfterWinner) return isRightPieceUsable ? [rightPiece] : []
	return []
}

// Two signals in one row cannot sound at once. The note that was just
// edited wins: older notes under it are cut short, split, or removed.
export const resolveOverlaps = (args: ResolveOverlapsArgsT): NoteT[] => {
	const winners = args.notes.filter((note) => args.winnerIds.has(note.id))
	let working = [...args.notes]

	for (const winner of winners) {
		const survivors: NoteT[] = []

		for (const other of working) {
			const isWinner = args.winnerIds.has(other.id)
			const isSameRow = other.pitch === winner.pitch
			const isOverlapping = checkDoOverlap(other, winner)
			const isUntouched = isWinner || !isSameRow || !isOverlapping
			if (isUntouched) {
				survivors.push(other)
				continue
			}

			const pieces = carveNote({ loser: other, winner, createId: args.createId })
			survivors.push(...pieces)
		}

		working = survivors
	}

	return working
}
