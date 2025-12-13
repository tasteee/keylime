import MidiWriter from 'midi-writer-js'
import { Note } from 'tonal'

type PerformanceNoteT = {
  id: string
  note: string
  startTime: number // in beats
  duration: number // in beats
  velocity: number
  chordId: string
  signalId: string
}

type ExportMidiArgsT = {
  performance: PerformanceNoteT[]
  bpm: number
  key: string
  scale: string
}

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

export const exportPerformanceAsMidi = (args: ExportMidiArgsT) => {
  const hasNoNotes = args.performance.length === 0
  if (hasNoNotes) {
    console.warn('No notes to export')
    return
  }

  const track = new MidiWriter.Track()
  track.setTempo(args.bpm)

  args.performance.forEach((performanceNote) => {
    const midiPitch = convertNoteToMidi({ note: performanceNote.note })
    // Convert beat-based timing to MIDI ticks
    const startTimeTicks = beatsToTicks(performanceNote.startTime)
    const durationTicks = beatsToTicks(performanceNote.duration)

    // Use absolute tick positioning instead of relative wait
    // This ensures notes at the same time start together
    const noteEvent = new MidiWriter.NoteEvent({
      pitch: midiPitch,
      duration: `T${durationTicks}`,
      velocity: performanceNote.velocity,
      tick: startTimeTicks
    })

    track.addEvent(noteEvent)
  })

  const writer = new MidiWriter.Writer(track)
  const dataUri = writer.dataUri()

  const randomId = crypto.randomUUID()
  const filename = `${args.key} ${args.scale} ${randomId}.mid`

  const link = document.createElement('a')
  link.href = dataUri
  link.download = filename
  link.click()
}
