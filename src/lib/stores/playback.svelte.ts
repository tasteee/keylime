import { Soundfont, SplendidGrandPiano } from 'smplr'
import INSTRUMENTS_CONFIG from '$lib/constants/instruments.json'
import output from './output.svelte.js'
import { WebMidi } from 'webmidi'
import { Note } from 'tonal'
import { generatePerformance } from '$lib/helpers/performance'
import { chordToNotes } from '$lib/helpers/chordToNotes'

type PlayArgsT = { note: string }

type PerformProjectArgsT = {
	id: string
	bpm: number
	octave: string
	progressionChords: ProgressionItemT[]
	patternSignals: SignalT[]
	patternSignalRows: SignalRowsT
	patternDurationBars: number
	minVelocity: number
	maxVelocity: number
}

const getRandomBetween = (args: { min: number; max: number }) => {
	return Math.floor(Math.random() * (args.max - args.min + 1)) + args.min
}

const getMidiOutput = () => {
	if (output.type !== 'MIDI') return null

	if (!output.midiChannel) {
		console.log('No MIDI channel set, returning null')
		return null
	}
	const midiOutput = WebMidi.getOutputByName(output.midiDeviceName)
	if (!midiOutput) {
		console.log('MIDI output device not found:', output.midiDeviceName)
		return null
	}
	const channelNumber = output.midiChannel === 'All' ? 1 : parseInt(output.midiChannel, 10)
	console.log('MIDI output found:', { device: midiOutput.name, channel: channelNumber })
	return midiOutput.channels[channelNumber]
}

const transposeNote = (args: { note: string; semitones: number }) => {
	const midiNumber = Note.midi(args.note)
	if (midiNumber === null) return args.note
	const transposedMidi = midiNumber + args.semitones
	const transposedNote = Note.fromMidiSharps(transposedMidi)
	return transposedNote
}

// stopAll, stopNote, stopChord, playNote, playChord,
// updatePerformancePlayback, beginPerformancePlayback, stopPerformancePlayback

const getProgressionTotalDuration = (progressionItems: ProgressionItemT[]): number => {
	if (!progressionItems.length) return 0
	return progressionItems.reduce((total, item) => total + item.durationBeats, 0)
}

type PlaybackInstrumentT = SplendidGrandPiano | Soundfont

type PlaybackInstrumentConfigT = {
	label: string
	value: string
	soundfontInstrumentName?: string
}

const getSelectedInstrumentKey = () => {
	const selectedInstrumentKey = output.instrument
	if (selectedInstrumentKey) return selectedInstrumentKey
	return 'piano'
}

const getSelectedInstrumentConfig = () => {
	const selectedInstrumentKey = getSelectedInstrumentKey()
	const availableInstruments = INSTRUMENTS_CONFIG.availableInstruments as Record<string, PlaybackInstrumentConfigT>
	const selectedInstrumentConfig = availableInstruments[selectedInstrumentKey as keyof typeof availableInstruments]
	if (selectedInstrumentConfig) return selectedInstrumentConfig
	return availableInstruments.piano
}

const createPlaybackInstrument = async (args: { context: AudioContext }): Promise<PlaybackInstrumentT> => {
	const selectedInstrumentKey = getSelectedInstrumentKey()
	if (selectedInstrumentKey === 'piano') return new SplendidGrandPiano(args.context).load

	const selectedInstrumentConfig = getSelectedInstrumentConfig()
	const soundfontInstrumentName = selectedInstrumentConfig.soundfontInstrumentName
	if (!soundfontInstrumentName) return new SplendidGrandPiano(args.context).load

	return new Soundfont(args.context, {
		instrument: soundfontInstrumentName
	}).load
}

class PlaybackStore {
	context = $state(null) as unknown as AudioContext
	piano = $state(null) as PlaybackInstrumentT | null
	activeChords = $state(new Set()) as Set<string>
	currentlyPlayingChordId = $state(null) as string | null
	currentlyPlayingChordNotes = $state(new Set()) as Set<string>
	isLoading = $state(false)
	isLoaded = $state(false)
	isPlaying = $state(false)
	loadedInstrumentKey = $state('')
	currentProjectId = $state<string | null>(null)
	loopStartTime = $state(0)
	scheduledNotes = $state(new Map()) as Map<string, ReturnType<typeof setTimeout>>
	activeNoteInstances = $state(new Map()) as Map<string, Set<string>>
	loadPromise: Promise<void> | null = null

	// In-memory performance data
	currentPerformance = $state<PerformanceNoteT[]>([])
	currentBpm = $state(120)
	currentOctave = $state('3')
	currentProgressionDuration = $state(0)

	isSelectedInstrumentLoaded = () => {
		const selectedInstrumentKey = getSelectedInstrumentKey()
		return this.isLoaded && this.loadedInstrumentKey === selectedInstrumentKey
	}

	loadSelectedInstrument = async () => {
		const selectedInstrumentKey = getSelectedInstrumentKey()

		console.log('PlaybackStore: load called', {
			isLoaded: this.isLoaded,
			isLoading: this.isLoading,
			selectedInstrumentKey,
			loadedInstrumentKey: this.loadedInstrumentKey
		})

		this.isLoading = true
		console.log('Loading project...')

		try {
			if (this.context) await this.context.resume()
			if (!this.context) this.context = new AudioContext()

			const isSwitchingInstrument = this.loadedInstrumentKey !== '' && this.loadedInstrumentKey !== selectedInstrumentKey
			if (isSwitchingInstrument) {
				this.stopAllScheduledNotes()
				this.piano?.stop()
			}

			const playbackInstrument = await createPlaybackInstrument({ context: this.context })
			this.piano = playbackInstrument
			this.piano.output.setVolume(output.volume)
			this.loadedInstrumentKey = selectedInstrumentKey
			this.isLoaded = true
		} finally {
			this.isLoading = false
		}
	}

	load = async () => {
		const isCurrentInstrumentLoaded = this.isSelectedInstrumentLoaded()
		if (isCurrentInstrumentLoaded) return

		if (this.loadPromise) {
			await this.loadPromise
			return
		}

		this.loadPromise = this.loadSelectedInstrument()

		try {
			await this.loadPromise
		} finally {
			this.loadPromise = null
		}
	}

	playNote = async (args: PlayArgsT) => {
		console.log('playNote called with:', args.note)
		const isInstrumentNotReady = !this.isSelectedInstrumentLoaded()
		if (isInstrumentNotReady) await this.load()

		this.activeChords.add(args.note)
		const midiOutput = getMidiOutput()
		const velocity = getRandomBetween({ min: output.minVelocity, max: output.maxVelocity })
		if (!midiOutput) {
			this.piano?.start({ note: args.note, velocity })
			return
		}

		midiOutput.playNote(args.note, { attack: velocity / 127 })
	}

	playChord = async (chord: ChordT, octave: string, durationMs: number = 500) => {
		console.log('playChord called with:', { chord, octave, durationMs })
		// Stop only the previously playing chord notes, not the performance playback
		this.currentlyPlayingChordNotes.forEach((note) => {
			this.stopNote({ note })
		})
		this.currentlyPlayingChordNotes.clear()

		// Track currently playing chord
		this.currentlyPlayingChordId = chord.id

		// Derive notes from chord at play time
		const notes = chordToNotes({ chord, rootOctave: octave })

		// Play notes with slight delay for arpeggio effect
		notes.forEach((note, index) => {
			setTimeout(() => {
				this.playNote({ note })
				this.currentlyPlayingChordNotes.add(note)
			}, index * 11)
		})

		// Auto-stop after duration
		setTimeout(() => {
			notes.forEach((note) => {
				this.stopNote({ note })
				this.currentlyPlayingChordNotes.delete(note)
			})
			this.currentlyPlayingChordId = null
		}, durationMs)
	}

	stopChord = (chord: ChordT) => {
		const isNotCurrentChord = this.currentlyPlayingChordId !== chord.id
		if (isNotCurrentChord) return

		this.currentlyPlayingChordNotes.forEach((note) => {
			this.stopNote({ note })
		})

		this.currentlyPlayingChordNotes.clear()
		this.currentlyPlayingChordId = null
	}

	stopNote = (args: PlayArgsT) => {
		const isActive = this.activeChords.has(args.note)
		const midiOutput = getMidiOutput()
		if (!isActive) return
		if (midiOutput) midiOutput.stopNote(args.note)
		if (!midiOutput) this.piano?.stop({ stopId: args.note })
		this.activeChords.delete(args.note)
	}

	// Convert project settings and pattern to in-memory MIDI performance and begin playback
	perform = async (project: PerformProjectArgsT) => {
		console.warn('\n\n\nperform called with project:', {
			id: project.id,
			bpm: project.bpm,
			octave: project.octave,
			progressionChords: project.progressionChords,
			patternSignals: project.patternSignals,
			patternDurationBars: project.patternDurationBars,
			minVelocity: project.minVelocity,
			maxVelocity: project.maxVelocity
		})
		const isInstrumentNotReady = !this.isSelectedInstrumentLoaded()
		if (isInstrumentNotReady) await this.load()

		// If different project, stop current playback first
		const isDifferentProject = this.currentProjectId !== null && this.currentProjectId !== project.id
		if (isDifferentProject) this.stop()

		this.currentProjectId = project.id

		// Log what we received
		// console.log('=== PERFORM CALLED ===')
		// console.log('Project ID:', project.id)
		// console.log('Progression Chords:', project.progressionChords)
		// console.log('Pattern Signals:', project.patternSignals)
		// console.log('Pattern Duration Bars:', project.patternDurationBars)
		// console.log('======================')

		// Generate performance from project data
		const patternLengthBeats = project.patternDurationBars * 4
		const progressionLengthBeats = getProgressionTotalDuration(project.progressionChords)

		this.currentPerformance = generatePerformance({
			chords: project.progressionChords,
			signals: project.patternSignals,
			signalRows: project.patternSignalRows,
			patternLengthBeats,
			progressionLengthBeats,
			octave: project.octave,
			minVelocity: project.minVelocity,
			maxVelocity: project.maxVelocity
		})

		this.currentBpm = project.bpm
		this.currentOctave = project.octave
		this.currentProgressionDuration = progressionLengthBeats

		// Log the full generated performance before playback
		console.log('=== PERFORMANCE PLAYBACK START ===')
		console.log('Performance notes:', this.currentPerformance.length)
		console.log('Progression chords:', project.progressionChords.length)
		console.log('Pattern signals:', project.patternSignals.length)
		console.log('Performance Duration (beats):', this.currentProgressionDuration)
		console.log('Pattern Duration (beats):', patternLengthBeats)
		console.log('BPM:', this.currentBpm)
		console.log('Expected repeats:', Math.ceil(this.currentProgressionDuration / patternLengthBeats))
		console.log('===================================')

		this.isPlaying = true
		this.runPlaybackLoop()
	}

	// Update the in-memory performance without interrupting playback
	update = (project: PerformProjectArgsT) => {
		const isNotPlaying = !this.isPlaying
		if (isNotPlaying) return

		const isSameProject = this.currentProjectId === project.id
		if (!isSameProject) return

		// Generate new performance from updated project data
		const patternLengthBeats = project.patternDurationBars * 4
		const progressionLengthBeats = getProgressionTotalDuration(project.progressionChords)

		this.currentPerformance = generatePerformance({
			chords: project.progressionChords,
			signals: project.patternSignals,
			signalRows: project.patternSignalRows,
			patternLengthBeats,
			progressionLengthBeats,
			octave: project.octave,
			minVelocity: project.minVelocity,
			maxVelocity: project.maxVelocity
		})

		this.currentBpm = project.bpm
		this.currentOctave = project.octave
		this.currentProgressionDuration = progressionLengthBeats
	}

	// Stop playback and clear in-memory performance
	stop = () => {
		this.isPlaying = false
		this.currentProjectId = null
		this.currentPerformance = []
		this.currentBpm = 120
		this.currentOctave = '3'
		this.currentProgressionDuration = 0
		this.stopAllScheduledNotes()
	}

	// Legacy methods for backward compatibility
	playPerformance = async () => {
		console.warn('playPerformance is deprecated. Use perform(project) instead.')
	}

	pausePerformance = () => {
		this.isPlaying = false
		this.stopAllScheduledNotes()
	}

	stopPerformance = () => {
		this.stop()
	}

	togglePlayback = async () => {
		console.warn('togglePlayback is deprecated. Use perform(project) or stop() instead.')
	}

	stopAllScheduledNotes = () => {
		this.scheduledNotes.forEach((timeoutId) => {
			clearTimeout(timeoutId)
		})
		this.scheduledNotes.clear()

		const allActiveNotes = Array.from(this.activeChords)
		allActiveNotes.forEach((note) => {
			this.stopNote({ note })
		})

		this.activeNoteInstances.clear()
	}

	runPlaybackLoop = () => {
		if (!this.isPlaying) return
		const hasNoPerformance = this.currentPerformance.length === 0
		if (hasNoPerformance) return this.stop()

		// Convert beats to milliseconds for actual playback
		const msPerBeat = 60000 / this.currentBpm
		this.loopStartTime = performance.now()

		this.currentPerformance.forEach((performanceNote) => {
			// Convert beat-based timing to milliseconds
			const noteStartMs = performanceNote.startTime * msPerBeat
			const noteDurationMs = performanceNote.duration * msPerBeat

			const noteStartTimeoutId = setTimeout(() => {
				if (!this.isPlaying) return
				const midiOutput = getMidiOutput()
				const velocity = performanceNote.velocity
				const noteId = performanceNote.id

				// Track this note instance
				if (!this.activeNoteInstances.has(performanceNote.note))
					this.activeNoteInstances.set(performanceNote.note, new Set())
				this.activeNoteInstances.get(performanceNote.note)!.add(noteId)

				if (!midiOutput) {
					this.piano?.start({ note: performanceNote.note, velocity, stopId: noteId })
				}
				if (midiOutput) midiOutput.playNote(performanceNote.note, { attack: velocity / 127 })
				this.activeChords.add(performanceNote.note)

				const noteStopTimeoutId = setTimeout(() => {
					// Stop this specific note instance
					const noteInstances = this.activeNoteInstances.get(performanceNote.note)
					if (noteInstances) {
						noteInstances.delete(noteId)
						if (noteInstances.size === 0) {
							this.activeNoteInstances.delete(performanceNote.note)
							this.activeChords.delete(performanceNote.note)
						}
					}

					if (midiOutput) midiOutput.stopNote(performanceNote.note)
					if (!midiOutput) this.piano?.stop({ stopId: noteId })
					this.scheduledNotes.delete(performanceNote.id + '-stop')
				}, noteDurationMs)

				this.scheduledNotes.set(performanceNote.id + '-stop', noteStopTimeoutId)
				this.scheduledNotes.delete(performanceNote.id + '-start')
			}, noteStartMs)

			this.scheduledNotes.set(performanceNote.id + '-start', noteStartTimeoutId)
		})

		// Convert performance duration from beats to milliseconds for looping
		const loopDurationMs = this.currentProgressionDuration * msPerBeat
		const loopTimeoutId = setTimeout(() => {
			if (!this.isPlaying) return
			this.runPlaybackLoop()
		}, loopDurationMs)

		this.scheduledNotes.set('loop', loopTimeoutId)
	}
}

const playbackStore = new PlaybackStore()
export default playbackStore
