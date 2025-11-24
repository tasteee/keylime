import { SplendidGrandPiano } from 'smplr'
import output from './output.svelte.js'
import main from './main.svelte.js'
import CHORD_MODES_CONFIG from '$lib/constants/chordModes.json'
import { WebMidi } from 'webmidi'
import { Note } from 'tonal'

type PlayArgsT = { note: string }

const getRandomBetween = (args: { min: number; max: number }) => {
  return Math.floor(Math.random() * (args.max - args.min + 1)) + args.min
}

const getMidiOutput = () => {
  if (output.type !== 'MIDI') return null
  if (!output.midiChannel) return null
  if (output.midiChannel === 'All') return null
  const midiOutput = WebMidi.getOutputByName(output.midiDeviceName)
  if (!midiOutput) return null
  const channel = parseInt(output.midiChannel, 10)
  return midiOutput.channels[channel]
}

const transposeNote = (args: { note: string; semitones: number }) => {
  const midiNumber = Note.midi(args.note)
  if (midiNumber === null) return args.note
  const transposedMidi = midiNumber + args.semitones
  const transposedNote = Note.fromMidiSharps(transposedMidi)
  return transposedNote
}

const getChordNotes = (args: { rootNote: string }) => {
  const chordModeConfig = CHORD_MODES_CONFIG.find((config) => config.name === main.selectedChordMode)

  if (!chordModeConfig) return [args.rootNote]
  if (chordModeConfig.intervals.length === 0) return [args.rootNote]

  const chordNotes = chordModeConfig.intervals.map((interval) => {
    return transposeNote({ note: args.rootNote, semitones: interval })
  })

  return chordNotes
}

class PlaybackStore {
  context = $state(null) as unknown as AudioContext
  piano = $state(null) as unknown as SplendidGrandPiano
  activeChords = $state(new Map()) as Map<string, string[]>
  isLoading = $state(false)
  isLoaded = $state(false)

  load = async () => {
    if (this.isLoaded) return
    if (this.isLoading) return
    this.isLoading = true

    if (this.context) await this.context.resume()
    if (!this.context) this.context = new AudioContext()
    console.log('context ready', this.context)

    // Create piano instance and wait for samples to load
    const pianoInstance = await new SplendidGrandPiano(this.context).load
    this.piano = pianoInstance

    console.log('piano ready', pianoInstance)
    this.isLoaded = true
    this.isLoading = false
  }

  play = async (args: PlayArgsT) => {
    console.log('play note', args.note)

    // Ensure playback is loaded before attempting to play
    const isNotLoaded = !this.isLoaded
    if (isNotLoaded) {
      await this.load()
    }

    const chordNotes = getChordNotes({ rootNote: args.note })
    this.activeChords.set(args.note, chordNotes)
    const midiOutput = getMidiOutput()


    chordNotes.forEach((chordNote) => {
      const velocity = getRandomBetween({ min: output.minVelocity, max: output.maxVelocity })
      console.log({ chordNote, velocity })
      if (!midiOutput) {
        this.piano.start({ note: chordNote, velocity })
      } else {
        midiOutput.playNote(chordNote, { attack: velocity / 1000 })
      }
    })
  }

  stop = (args: { note: string }) => {
    const chordNotes = this.activeChords.get(args.note)
    if (!chordNotes) return

    const midiOutput = getMidiOutput()

    chordNotes.forEach((chordNote) => {
      if (!midiOutput) {
        const isPianoLoaded = this.piano !== null
        if (isPianoLoaded) {
          this.piano.stop({ stopId: chordNote })
        }
      } else {
        midiOutput.stopNote(chordNote)
      }
    })

    this.activeChords.delete(args.note)
  }
}

const playbackStore = new PlaybackStore()
export default playbackStore
