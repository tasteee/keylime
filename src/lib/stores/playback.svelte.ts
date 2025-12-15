import { SplendidGrandPiano } from 'smplr'
import output from './output.svelte.js'
import main from './main.svelte.js'
import CHORD_MODES_CONFIG from '$lib/constants/chordModes.json'
import { WebMidi } from 'webmidi'
import { Note } from 'tonal'
import { progressionStore } from './progression.svelte.js'
import { patternStore } from './pattern.svelte.js'
import { generatePerformance } from '$lib/helpers/performance'
import { chordToNotes } from '$lib/helpers/chordToNotes'

type PlayArgsT = { note: string }

const getRandomBetween = (args: { min: number; max: number }) => {
  return Math.floor(Math.random() * (args.max - args.min + 1)) + args.min
}

const getMidiOutput = () => {
  if (output.type !== 'MIDI') {
    // console.log('Output type is not MIDI, returning null')
    return null
  }
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

class PlaybackStore {
  context = $state(null) as unknown as AudioContext
  piano = $state(null) as unknown as SplendidGrandPiano
  activeChords = $state(new Set()) as Set<string>
  isLoading = $state(false)
  isLoaded = $state(false)
  isPlaying = $state(false)
  currentBeat = $state(0)
  scheduledNotes = $state(new Map()) as Map<string, ReturnType<typeof setTimeout>>
  activeNoteInstances = $state(new Map()) as Map<string, Set<string>> // note -> Set of performance note IDs

  // The result of applying the pattern to the progression.
  // All timing is in beats.
  performance = $derived.by(() => {
    const chords = progressionStore.chords
    const signals = patternStore.activeSignals
    const signalRows = patternStore.signalRows
    const patternLengthBeats = patternStore.activePatternLengthBeats
    const progressionLengthBeats = progressionStore.getTotalDuration() // Sum of all chord durations
    const performance = generatePerformance({
      chords,
      signals,
      signalRows,
      patternLengthBeats,
      progressionLengthBeats
    })
    const data = JSON.parse(JSON.stringify({ performance, patternLengthBeats, progressionLengthBeats, chords, signals }))
    console.log('Generated performance notes:', data)
    return performance
  })

  // Performance duration in beats - uses actual progression duration for proper looping
  performanceDuration = $derived.by(() => {
    const progressionLengthBeats = progressionStore.getTotalDuration()
    console.log('Performance duration (beats):', progressionLengthBeats)
    return progressionLengthBeats
  })

  load = async () => {
    if (this.isLoaded) return
    if (this.isLoading) return
    this.isLoading = true
    if (this.context) await this.context.resume()
    if (!this.context) this.context = new AudioContext()
    const pianoInstance = await new SplendidGrandPiano(this.context).load
    this.piano = pianoInstance
    this.piano.output.setVolume(output.volume)
    this.isLoaded = true
    this.isLoading = false
  }

  playNote = async (args: PlayArgsT) => {
    if (!this.isLoaded) await this.load()
    this.activeChords.add(args.note)
    const midiOutput = getMidiOutput()
    const velocity = getRandomBetween({ min: output.minVelocity, max: output.maxVelocity })
    console.log('playNote:', { note: args.note, velocity, hasMidiOutput: !!midiOutput })
    if (!midiOutput) {
      this.piano.start({ note: args.note, velocity })
    } else {
      console.log('Sending MIDI note:', args.note, 'velocity:', velocity)
      midiOutput.playNote(args.note, { attack: velocity / 127 })
    }
  }

  playChord = async (chord: ChordT, durationMs: number = 500) => {
    // Stop any currently playing chord
    this.stopAllScheduledNotes()

    // Derive notes from chord at play time
    const notes = chordToNotes({ chord, rootOctave: main.rootOctave })

    // Play notes with slight delay for arpeggio effect
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.playNote({ note })
      }, index * 11)
    })

    // Auto-stop after duration
    setTimeout(() => {
      notes.forEach((note) => {
        this.stopNote({ note })
      })
    }, durationMs)
  }

  stopNote = (args: PlayArgsT) => {
    const isActive = this.activeChords.has(args.note)
    const midiOutput = getMidiOutput()
    if (!isActive) return
    if (midiOutput) midiOutput.stopNote(args.note)
    if (!midiOutput) this.piano.stop({ stopId: args.note })
    this.activeChords.delete(args.note)
  }

  playPerformance = async () => {
    const isNotLoaded = !this.isLoaded
    if (isNotLoaded) await this.load()

    this.isPlaying = true
    this.currentBeat = 0
    this.runPlaybackLoop()
  }

  pausePerformance = () => {
    this.isPlaying = false
    this.stopAllScheduledNotes()
  }

  stopPerformance = () => {
    this.isPlaying = false
    this.currentBeat = 0
    this.stopAllScheduledNotes()
  }

  togglePlayback = async () => {
    const shouldPlay = !this.isPlaying
    if (shouldPlay) await this.playPerformance()
    if (!shouldPlay) {
      // Small delay to ensure audio context is ready to stop all notes
      setTimeout(() => {
        this.pausePerformance()
      }, 150)
    }
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

    const hasNoPerformance = this.performance.length === 0
    if (hasNoPerformance) {
      this.stopPerformance()
      return
    }

    // Convert beats to milliseconds for actual playback
    const bpm = main.bpm
    const msPerBeat = 60000 / bpm
    const loopStartTime = Date.now()

    this.performance.forEach((performanceNote) => {
      // Convert beat-based timing to milliseconds
      const noteStartMs = performanceNote.startTime * msPerBeat
      const noteDurationMs = performanceNote.duration * msPerBeat

      const noteStartTimeoutId = setTimeout(() => {
        if (!this.isPlaying) return
        const midiOutput = getMidiOutput()
        const velocity = performanceNote.velocity
        const noteId = performanceNote.id
        console.log('Performance note:', { note: performanceNote.note, velocity, hasMidiOutput: !!midiOutput })

        // Track this note instance
        if (!this.activeNoteInstances.has(performanceNote.note)) {
          this.activeNoteInstances.set(performanceNote.note, new Set())
        }
        this.activeNoteInstances.get(performanceNote.note)!.add(noteId)

        if (!midiOutput) {
          this.piano.start({ note: performanceNote.note, velocity, stopId: noteId })
        } else {
          console.log('Sending MIDI performance note:', performanceNote.note, 'velocity:', velocity)
          midiOutput.playNote(performanceNote.note, { attack: velocity / 127 })
        }
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

          if (midiOutput) {
            midiOutput.stopNote(performanceNote.note)
          } else {
            this.piano.stop({ stopId: noteId })
          }
          this.scheduledNotes.delete(performanceNote.id + '-stop')
        }, noteDurationMs)

        this.scheduledNotes.set(performanceNote.id + '-stop', noteStopTimeoutId)
        this.scheduledNotes.delete(performanceNote.id + '-start')
      }, noteStartMs)

      this.scheduledNotes.set(performanceNote.id + '-start', noteStartTimeoutId)
    })

    // Convert performance duration from beats to milliseconds for looping
    const loopDurationMs = this.performanceDuration * msPerBeat
    const loopTimeoutId = setTimeout(() => {
      if (!this.isPlaying) return
      this.currentBeat = 0
      this.runPlaybackLoop()
    }, loopDurationMs)

    this.scheduledNotes.set('loop', loopTimeoutId)
  }
}

const playbackStore = new PlaybackStore()
export default playbackStore
