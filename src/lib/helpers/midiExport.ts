import MidiWriter from 'midi-writer-js'
import { Note } from 'tonal'
import { chordToNotes } from './chordToNotes'
import { numbers } from './numbers'
import { generatePerformance } from './performance'
import { getProgressionTotalDuration } from './progression'

// MIDI standard: 128 ticks per quarter note (beat)
const TICKS_PER_BEAT = 128

const convertNoteToMidi = (args: { note: string }): number => {
	const midiNumber = Note.midi(args.note)
	if (midiNumber === null) return 60
	return midiNumber
}

const beatsToTicks = (beats: number): number => {
	return Math.round(beats * TICKS_PER_BEAT)
}

const createDebugLog = (args: {
	project: ProjectT
	patternLengthBeats: number
	progressionLengthBeats: number
	performance: PerformanceNoteT[]
}) => {
	const lines: string[] = []

	lines.push('='.repeat(60))
	lines.push('MIDI EXPORT DEBUG LOG')
	lines.push('='.repeat(60))
	lines.push('')

	// Project info
	lines.push('INPUT PROJECT:')
	lines.push(`- BPM: ${args.project.bpm}`)
	lines.push(`- Base Octave: ${args.project.octave}`)
	lines.push(`- Key: ${args.project.key}`)
	lines.push(`- Scale: ${args.project.scale}`)
	lines.push('')

	// Progression info
	lines.push(
		`INPUT PROGRESSION (duration: ${args.progressionLengthBeats} beats = ${args.progressionLengthBeats / 4} bars):`
	)
	args.project.progressionChords.forEach((chord, chordIndex) => {
		const notes = chordToNotes({ chord, rootOctave: args.project.octave })
		const startTime = chord.startTime ?? 0
		lines.push(
			`- [${chordIndex}] ${chord.symbol}, start: ${startTime}b, duration: ${chord.durationBeats}b, notes: ${notes.join(' ')}`
		)
	})
	lines.push('')

	// Pattern info with signal row mapping
	const getSignalRowForSignal = (signalId: string): SignalRowT | null => {
		const rowEntries = Object.entries(args.project.patternSignalRows)
		const foundEntry = rowEntries.find(([, row]) => row.signalIds.includes(signalId))
		if (!foundEntry) return null
		return foundEntry[1]
	}

	lines.push(`INPUT PATTERN (duration: ${args.patternLengthBeats} beats = ${args.patternLengthBeats / 4} bars):`)
	const sortedSignals = [...args.project.patternSignals].sort((signalA, signalB) => signalA.startTime - signalB.startTime)
	sortedSignals.forEach((signal, signalIndex) => {
		const signalRow = getSignalRowForSignal(signal.id)
		const rowLabel = signalRow?.label ?? 'UNKNOWN'
		const rowNoteIndex = signalRow?.index ?? '?'
		const octaveDisplay =
			signal.octaveOffset === 0 ? '' : signal.octaveOffset > 0 ? `+${signal.octaveOffset}` : signal.octaveOffset.toString()
		lines.push(
			`- [${signalIndex}] ${rowLabel}${octaveDisplay} (row noteIndex: ${rowNoteIndex}), start: ${signal.startTime}b, duration: ${signal.duration}b`
		)
	})
	lines.push('')

	// Calculate expected count
	const numberOfPatternRepeats = Math.ceil(args.progressionLengthBeats / args.patternLengthBeats)
	const expectedNoteCount = args.project.patternSignals.length * numberOfPatternRepeats

	// Performance output
	lines.push(`OUTPUT PERFORMANCE (total notes: ${args.performance.length}):`)
	args.performance.forEach((perfNote, noteIndex) => {
		const chord = args.project.progressionChords.find((chord) => chord.id === perfNote.chordId)
		const chordSymbol = chord?.symbol ?? 'UNKNOWN'
		const chordIndexInProgression = args.project.progressionChords.findIndex((chord) => chord.id === perfNote.chordId)
		const chordNotes = chord ? chordToNotes({ chord, rootOctave: args.project.octave }) : []
		const chordNotesDisplay = chordNotes.length > 0 ? ` [${chordNotes.join(' ')}]` : ''

		const signal = args.project.patternSignals.find((signal) => signal.id === perfNote.signalId)
		const signalRow = signal ? getSignalRowForSignal(signal.id) : null
		const rowLabel = signalRow?.label ?? 'UNKNOWN'
		const rowNoteIndex = signalRow?.index ?? '?'
		const octaveDisplay =
			signal?.octaveOffset === 0
				? ''
				: signal && signal.octaveOffset > 0
					? `+${signal.octaveOffset}`
					: (signal?.octaveOffset.toString() ?? '')

		lines.push(
			`- [${noteIndex}] ${perfNote.note} ← chord[${chordIndexInProgression}] ${chordSymbol}${chordNotesDisplay}, from ${rowLabel}${octaveDisplay} (noteIdx ${rowNoteIndex}), time: ${perfNote.startTime}b, dur: ${perfNote.duration}b`
		)
	})
	lines.push('')

	// Summary
	lines.push('SUMMARY:')
	lines.push(`- Pattern repeats: ${numberOfPatternRepeats}x`)
	lines.push(`- Signals per pattern: ${args.project.patternSignals.length}`)
	lines.push(`- Expected note count (approx): ${expectedNoteCount}`)
	lines.push(`- Actual note count: ${args.performance.length}`)
	const countDifference = args.performance.length - expectedNoteCount
	const countDifferenceDisplay = countDifference >= 0 ? `+${countDifference}` : countDifference.toString()
	lines.push(`- Difference: ${countDifferenceDisplay}`)
	lines.push('')
	lines.push('='.repeat(60))

	const logOutput = lines.join('\n')
	console.log(logOutput)
	return logOutput
}

export const exportPerformanceAsMidi = (project: ProjectT) => {
	const patternLengthBeats = project.patternDurationBars * 4
	const progressionLengthBeats = getProgressionTotalDuration(project.progressionChords)

	const performance = generatePerformance({
		chords: project.progressionChords,
		signals: project.patternSignals,
		signalRows: project.patternSignalRows,
		patternLengthBeats,
		progressionLengthBeats,
		octave: project.octave,
		minVelocity: project.minVelocity,
		maxVelocity: project.maxVelocity
	})

	// Generate debug log
	createDebugLog({
		project,
		patternLengthBeats,
		progressionLengthBeats,
		performance
	})

	const hasNoNotes = performance.length === 0
	if (hasNoNotes) {
		console.warn('No notes to export')
		return
	}

	const track = new MidiWriter.Track()
	track.setTempo(project.bpm)

	// Group notes by start time and duration to play simultaneously
	type GroupKeyT = string
	const noteGroups = new Map<GroupKeyT, PerformanceNoteT[]>()

	performance.forEach((performanceNote) => {
		const groupKey = `${performanceNote.startTime}_${performanceNote.duration}`
		const existingGroup = noteGroups.get(groupKey)
		if (!existingGroup) {
			noteGroups.set(groupKey, [performanceNote])
		} else {
			existingGroup.push(performanceNote)
		}
	})

	// Sort groups by start time
	const sortedGroups = Array.from(noteGroups.entries()).sort((groupA, groupB) => {
		const startTimeA = groupA[1][0].startTime
		const startTimeB = groupB[1][0].startTime
		return startTimeA - startTimeB
	})

	// Create MIDI events for each group
	sortedGroups.forEach(([groupKey, notes]) => {
		const firstNote = notes[0]
		const startTimeTicks = beatsToTicks(firstNote.startTime)
		const durationTicks = beatsToTicks(firstNote.duration)

		const hasSingleNote = notes.length === 1
		if (hasSingleNote) {
			const midiPitch = convertNoteToMidi({ note: firstNote.note })
			const noteEvent = new MidiWriter.NoteEvent({
				pitch: midiPitch,
				duration: `T${durationTicks}`,
				velocity: firstNote.velocity,
				tick: startTimeTicks
			})
			track.addEvent(noteEvent)
		} else {
			const midiPitches = notes.map((note) => convertNoteToMidi({ note: note.note }))
			const averageVelocity = Math.round(notes.reduce((sum, note) => sum + note.velocity, 0) / notes.length)
			const noteEvent = new MidiWriter.NoteEvent({
				pitch: midiPitches,
				duration: `T${durationTicks}`,
				velocity: averageVelocity,
				tick: startTimeTicks
			})
			track.addEvent(noteEvent)
		}
	})

	// Add a silent note at the end of the progression to ensure full duration
	const endOfProgressionTicks = beatsToTicks(progressionLengthBeats)
	const silentNoteEvent = new MidiWriter.NoteEvent({
		pitch: 0,
		duration: `T1`,
		velocity: 0,
		tick: endOfProgressionTicks
	})
	track.addEvent(silentNoteEvent)

	const writer = new MidiWriter.Writer(track)
	const dataUri = writer.dataUri()

	const randomNumber = numbers.randomize(1000, 9999)
	const filename = `${project.title} ${project.key} ${project.scale} ${randomNumber}.mid`

	const link = document.createElement('a')
	link.href = dataUri
	link.download = filename
	link.click()
}

export const exportChordsAsMidi = (project: ProjectT) => {
	const hasNoChords = project.progressionChords.length === 0
	if (hasNoChords) return console.warn('No chords to export')

	const track = new MidiWriter.Track()
	track.setTempo(project.bpm)

	project.progressionChords.forEach((progressionChord) => {
		const notes = chordToNotes({
			chord: progressionChord,
			rootOctave: project.octave
		})

		const startTimeTicks = beatsToTicks(progressionChord.startTime ?? 0)
		const durationTicks = beatsToTicks(progressionChord.durationBeats)

		// Convert all notes to MIDI numbers and pass as array so they play simultaneously
		const midiPitches = notes.map((note) => convertNoteToMidi({ note }))

		const noteEvent = new MidiWriter.NoteEvent({
			pitch: midiPitches,
			duration: `T${durationTicks}`,
			velocity: 80,
			tick: startTimeTicks
		})

		track.addEvent(noteEvent)
	})

	const writer = new MidiWriter.Writer(track)
	const dataUri = writer.dataUri()

	const randomNumber = numbers.randomize(1000, 9999)
	const filename = `${project.title} ${project.key} ${project.scale} Chords ${randomNumber}.mid`

	const link = document.createElement('a')
	link.href = dataUri
	link.download = filename
	link.click()
}
