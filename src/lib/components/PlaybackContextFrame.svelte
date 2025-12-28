<script lang="ts">
	import { SplendidGrandPiano } from 'smplr'
	import { WebMidi } from 'webmidi'
	import { setContext, onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { chordToNotes } from '$lib/helpers/chordToNotes'
	import { generatePerformance } from '$lib/helpers/performance'
	import outputStore from '$lib/stores/output.svelte'
	import GENERAL_CONFIG from '$lib/constants/general.json'

	const props = $props()

	type PlayNoteArgsT = {
		note: string
	}

	type PerformProjectArgsT = {
		id: string
		bpm: number
		octave: string
		progressionChords: ProgressionItemT[]
		patternSignals: SignalT[]
		patternSignalRows: SignalRowsT
		patternDurationBars: number
	}

	type PlaybackStateT = {
		context: AudioContext | null
		piano: SplendidGrandPiano | null
		activeChords: Set<string>
		currentlyPlayingChordId: string | null
		currentlyPlayingChordNotes: Set<string>
		isLoading: boolean
		isLoaded: boolean
		isPlaying: boolean
		currentProjectId: string | null
		loopStartTime: number
		scheduledNotes: Map<string, ReturnType<typeof setTimeout>>
		activeNoteInstances: Map<string, Set<string>>
		activePerformance: PerformanceNoteT[]
		currentBpm: number
		currentOctave: string
		currentProgressionDuration: number
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

	const getRandomBetween = (args: { min: number; max: number }) => {
		return Math.floor(Math.random() * (args.max - args.min + 1)) + args.min
	}

	const getMidiOutput = () => {
		const outputType = outputStore.type
		if (outputType !== 'MIDI') return null

		const midiChannel = outputStore.midiChannel
		if (!midiChannel) {
			console.log('No MIDI channel set, returning null')
			return null
		}

		const midiDeviceName = outputStore.midiDeviceName
		const midiOutput = WebMidi.getOutputByName(midiDeviceName)
		if (!midiOutput) {
			console.log('MIDI output device not found:', midiDeviceName)
			return null
		}

		const channelNumber = midiChannel === 'All' ? 1 : parseInt(midiChannel, 10)
		console.log('MIDI output found:', { device: midiOutput.name, channel: channelNumber })
		return midiOutput.channels[channelNumber]
	}

	const getProgressionTotalDuration = (progressionItems: ProgressionItemT[]): number => {
		const hasNoItems = progressionItems.length === 0
		if (hasNoItems) return 0
		return progressionItems.reduce((total, item) => total + item.durationBeats, 0)
	}

	const getPlaybackNoteHumanizationDelayMs = () => {
		const minMs = GENERAL_CONFIG.MIN_PLAYBACK_HUMANIZATION_MS
		const maxMs = GENERAL_CONFIG.MAX_PLAYBACK_HUMANIZATION_MS
		return getRandomBetween({ min: minMs, max: maxMs })
	}

	const playbackState = $state<PlaybackStateT>({
		context: null,
		piano: null,
		activeChords: new Set(),
		currentlyPlayingChordId: null,
		currentlyPlayingChordNotes: new Set(),
		isLoading: false,
		isLoaded: false,
		isPlaying: false,
		currentProjectId: null,
		loopStartTime: 0,
		scheduledNotes: new Map(),
		activeNoteInstances: new Map(),
		activePerformance: [],
		currentBpm: 120,
		currentOctave: '3',
		currentProgressionDuration: 0
	})

	const load = async () => {
		console.log('PlaybackContextFrame: load called', {
			isLoaded: playbackState.isLoaded,
			isLoading: playbackState.isLoading
		})

		const isAlreadyLoaded = playbackState.isLoaded
		if (isAlreadyLoaded) return

		const isCurrentlyLoading = playbackState.isLoading
		if (isCurrentlyLoading) return

		playbackState.isLoading = true
		console.log('Loading piano...')

		const hasContext = playbackState.context !== null
		if (hasContext) await playbackState.context?.resume()
		if (!hasContext) playbackState.context = new AudioContext()

		if (!playbackState.context) return

		const pianoInstance = await new SplendidGrandPiano(playbackState.context).load
		playbackState.piano = pianoInstance
		playbackState.piano.output.setVolume(outputStore.volume)
		playbackState.isLoaded = true
		playbackState.isLoading = false
	}

	const playNote = async (args: PlayNoteArgsT) => {
		const isNotLoaded = !playbackState.isLoaded
		if (isNotLoaded) await load()

		playbackState.activeChords.add(args.note)
		const midiOutput = getMidiOutput()
		const velocity = getRandomBetween({ min: outputStore.minVelocity, max: outputStore.maxVelocity })

		const isUsingMidi = midiOutput !== null
		if (!isUsingMidi) {
			playbackState.piano?.start({ note: args.note, velocity })
		}

		if (isUsingMidi) {
			midiOutput.playNote(args.note, { attack: velocity / 127 })
		}
	}

	const stopNote = (args: PlayNoteArgsT) => {
		const isActive = playbackState.activeChords.has(args.note)
		if (!isActive) return

		const midiOutput = getMidiOutput()
		const isUsingMidi = midiOutput !== null

		if (isUsingMidi) midiOutput.stopNote(args.note)
		if (!isUsingMidi) playbackState.piano?.stop({ stopId: args.note })

		playbackState.activeChords.delete(args.note)
	}

	const playChord = async (chord: ChordT, octave: string, durationMs: number = 500) => {
		// Stop only the previously playing chord notes, not the performance playback
		playbackState.currentlyPlayingChordNotes.forEach((note) => {
			stopNote({ note })
		})
		playbackState.currentlyPlayingChordNotes.clear()

		// Track currently playing chord
		playbackState.currentlyPlayingChordId = chord.id

		// Derive notes from chord at play time
		const notes = chordToNotes({ chord, rootOctave: octave })

		// Play notes with slight delay for arpeggio effect
		notes.forEach((note, index) => {
			const delayMs = getPlaybackNoteHumanizationDelayMs()

			setTimeout(() => {
				playNote({ note })
				playbackState.currentlyPlayingChordNotes.add(note)
			}, delayMs)
		})

		// Auto-stop after duration
		setTimeout(() => {
			notes.forEach((note) => {
				stopNote({ note })
				playbackState.currentlyPlayingChordNotes.delete(note)
			})
			playbackState.currentlyPlayingChordId = null
		}, durationMs)
	}

	const stopChord = (chord: ChordT) => {
		const isNotCurrentChord = playbackState.currentlyPlayingChordId !== chord.id
		if (isNotCurrentChord) return

		playbackState.currentlyPlayingChordNotes.forEach((note) => {
			stopNote({ note })
		})
		playbackState.currentlyPlayingChordNotes.clear()
		playbackState.currentlyPlayingChordId = null
	}

	const stopAllScheduledNotes = () => {
		playbackState.scheduledNotes.forEach((timeoutId) => {
			clearTimeout(timeoutId)
		})
		playbackState.scheduledNotes.clear()

		const allActiveNotes = Array.from(playbackState.activeChords)
		allActiveNotes.forEach((note) => {
			stopNote({ note })
		})

		playbackState.activeNoteInstances.clear()
	}

	const runPlaybackLoop = () => {
		const isNotPlaying = !playbackState.isPlaying
		if (isNotPlaying) return

		const hasNoPerformance = playbackState.activePerformance.length === 0
		if (hasNoPerformance) return stop()

		// Convert beats to milliseconds for actual playback
		const msPerBeat = 60000 / playbackState.currentBpm
		playbackState.loopStartTime = performance.now()

		playbackState.activePerformance.forEach((performanceNote) => {
			// Convert beat-based timing to milliseconds (ticks)
			const noteStartMs = performanceNote.startTime * msPerBeat
			const noteDurationMs = performanceNote.duration * msPerBeat

			const noteStartTimeoutId = setTimeout(() => {
				const isNotPlaying = !playbackState.isPlaying
				if (isNotPlaying) return

				const midiOutput = getMidiOutput()
				const velocity = performanceNote.velocity
				const noteId = performanceNote.id

				// Track this note instance
				const hasNoteInstances = playbackState.activeNoteInstances.has(performanceNote.note)
				if (!hasNoteInstances) playbackState.activeNoteInstances.set(performanceNote.note, new Set())
				playbackState.activeNoteInstances.get(performanceNote.note)!.add(noteId)

				const isUsingMidi = midiOutput !== null
				if (!isUsingMidi) playbackState.piano?.start({ note: performanceNote.note, velocity, stopId: noteId })
				if (isUsingMidi) midiOutput.playNote(performanceNote.note, { attack: velocity / 127 })

				playbackState.activeChords.add(performanceNote.note)

				const noteStopTimeoutId = setTimeout(() => {
					const isNotPlaying = !playbackState.isPlaying
					if (isNotPlaying) return

					const noteInstances = playbackState.activeNoteInstances.get(performanceNote.note)
					const hasNoteInstances = noteInstances !== undefined
					if (hasNoteInstances) noteInstances.delete(noteId)

					// Only stop the note if no more instances are playing
					const hasNoMoreInstances = noteInstances?.size === 0
					if (hasNoMoreInstances) {
						const isUsingMidi = midiOutput !== null
						if (isUsingMidi) midiOutput.stopNote(performanceNote.note)
						if (!isUsingMidi) playbackState.piano?.stop({ stopId: noteId })
						playbackState.activeChords.delete(performanceNote.note)
						playbackState.activeNoteInstances.delete(performanceNote.note)
					}

					playbackState.scheduledNotes.delete(performanceNote.id + '-stop')
				}, noteDurationMs)

				playbackState.scheduledNotes.set(performanceNote.id + '-stop', noteStopTimeoutId)
			}, noteStartMs)

			playbackState.scheduledNotes.set(performanceNote.id + '-start', noteStartTimeoutId)
		})

		// Convert performance duration from beats to milliseconds for looping
		const loopDurationMs = playbackState.currentProgressionDuration * msPerBeat
		const loopTimeoutId = setTimeout(() => {
			const isNotPlaying = !playbackState.isPlaying
			if (isNotPlaying) return
			runPlaybackLoop()
		}, loopDurationMs)

		playbackState.scheduledNotes.set('loop', loopTimeoutId)
	}

	const perform = async (project: PerformProjectArgsT) => {
		const isNotLoaded = !playbackState.isLoaded
		if (isNotLoaded) await load()

		// If different project, stop current playback first
		const isDifferentProject = playbackState.currentProjectId !== null && playbackState.currentProjectId !== project.id
		if (isDifferentProject) stop()

		playbackState.currentProjectId = project.id

		// Generate performance from project data
		const patternLengthBeats = project.patternDurationBars * 4
		const progressionLengthBeats = getProgressionTotalDuration(project.progressionChords)

		playbackState.activePerformance = generatePerformance({
			chords: project.progressionChords,
			signals: project.patternSignals,
			signalRows: project.patternSignalRows,
			patternLengthBeats,
			progressionLengthBeats,
			octave: project.octave,
			minVelocity: outputStore.minVelocity,
			maxVelocity: outputStore.maxVelocity
		})

		playbackState.currentBpm = project.bpm
		playbackState.currentOctave = project.octave
		playbackState.currentProgressionDuration = progressionLengthBeats

		// Log the full generated performance before playback
		console.log('=== PERFORMANCE PLAYBACK START ===')
		console.log('Performance notes:', playbackState.activePerformance.length)
		console.log('Progression chords:', project.progressionChords.length)
		console.log('Pattern signals:', project.patternSignals.length)
		console.log('Performance Duration (beats):', playbackState.currentProgressionDuration)
		console.log('Pattern Duration (beats):', patternLengthBeats)
		console.log('BPM:', playbackState.currentBpm)
		console.log('Expected repeats:', Math.ceil(playbackState.currentProgressionDuration / patternLengthBeats))
		console.log('===================================')

		playbackState.isPlaying = true
		runPlaybackLoop()
	}

	const update = (project: PerformProjectArgsT) => {
		const isNotPlaying = !playbackState.isPlaying
		if (isNotPlaying) return

		const isSameProject = playbackState.currentProjectId === project.id
		if (!isSameProject) return

		// Generate new performance from updated project data
		const patternLengthBeats = project.patternDurationBars * 4
		const progressionLengthBeats = getProgressionTotalDuration(project.progressionChords)

		playbackState.activePerformance = generatePerformance({
			chords: project.progressionChords,
			signals: project.patternSignals,
			signalRows: project.patternSignalRows,
			patternLengthBeats,
			progressionLengthBeats,
			octave: project.octave,
			minVelocity: outputStore.minVelocity,
			maxVelocity: outputStore.maxVelocity
		})

		playbackState.currentBpm = project.bpm
		playbackState.currentOctave = project.octave
		playbackState.currentProgressionDuration = progressionLengthBeats
	}

	const stop = () => {
		playbackState.isPlaying = false
		playbackState.currentProjectId = null
		playbackState.activePerformance = []
		playbackState.currentBpm = 120
		playbackState.currentOctave = '3'
		playbackState.currentProgressionDuration = 0
		stopAllScheduledNotes()
	}

	const pausePerformance = () => {
		playbackState.isPlaying = false
		stopAllScheduledNotes()
	}

	const stopPerformance = () => {
		stop()
	}

	const context: PlaybackContextT = {
		state: playbackState,
		load,
		playNote,
		playChord,
		stopNote,
		stopChord,
		perform,
		update,
		stop,
		pausePerformance,
		stopPerformance
	}

	setContext('playback', context)

	onMount(() => {
		if (!browser) return
		load()
	})
</script>

{@render props.children()}
