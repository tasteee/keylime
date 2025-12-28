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

export const exportPerformanceAsMidi = (project: ProjectT) => {
  const patternLengthBeats = project.patternDurationBars * 4
  const progressionLengthBeats = getProgressionTotalDuration(project.progressionChords)

  console.log('=== EXPORT PERFORMANCE DEBUG ===')
  console.log('Pattern length (beats):', patternLengthBeats)
  console.log('Progression length (beats):', progressionLengthBeats)
  console.log('Number of chords:', project.progressionChords.length)
  console.log('Number of signals:', project.patternSignals.length)
  console.log('Chords:', project.progressionChords.map((c) => ({ symbol: c.symbol, startTime: c.startTime, duration: c.durationBeats })))

  const performance = generatePerformance({
    chords: project.progressionChords,
    signals: project.patternSignals,
    signalRows: project.patternSignalRows,
    patternLengthBeats,
    progressionLengthBeats,
    octave: project.octave
  })

  console.log('Generated performance notes:', performance.length)
  console.log('Performance range:', performance.length > 0 ? `${performance[0].startTime} to ${performance[performance.length - 1].startTime + performance[performance.length - 1].duration}` : 'N/A')
  console.log('================================')

  const hasNoNotes = performance.length === 0
  if (hasNoNotes) {
    console.warn('No notes to export')
    return
  }

  const track = new MidiWriter.Track()
  track.setTempo(project.bpm)

  performance.forEach((performanceNote) => {
    const midiPitch = convertNoteToMidi({ note: performanceNote.note })
    const startTimeTicks = beatsToTicks(performanceNote.startTime)
    const durationTicks = beatsToTicks(performanceNote.duration)

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
