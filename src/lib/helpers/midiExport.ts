import { scaled, voiceProgression } from '$lib/music'
import { numbers } from './numbers'
import { generatePerformance } from './performance'
import { getProgressionTotalDuration } from './progression'

// Pitched at 480 ticks per beat, scaled's default, so every beat position is exact.
const TICKS_PER_BEAT = 480

const downloadMidiFile = (midiFile: Uint8Array & { fileName: string }) => {
  const blob = new Blob([midiFile as BlobPart], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = midiFile.fileName
  link.click()

  URL.revokeObjectURL(url)
}

const getFileName = (project: ProjectT, label?: string): string => {
  const randomNumber = numbers.randomize(1000, 9999)
  const labelPart = label ? ` ${label}` : ''
  return `${project.title} ${project.key} ${project.scale}${labelPart} ${randomNumber}`
}

export const exportPerformanceAsMidi = (project: ProjectT) => {
  const patternLengthBeats = project.patternDurationBars * 4
  const progressionLengthBeats = getProgressionTotalDuration(project.progressionChords)

  const notes = generatePerformance({
    chords: project.progressionChords,
    signals: project.patternSignals,
    signalRows: project.patternSignalRows,
    patternLengthBeats,
    progressionLengthBeats,
    doesPatternResetOnChordChange: project.doesPatternResetOnChordChange,
    octave: project.octave,
    minVelocity: project.minVelocity,
    maxVelocity: project.maxVelocity
  })

  const hasNoNotes = notes.length === 0
  if (hasNoNotes) {
    console.warn('No notes to export')
    return
  }

  const clip = { durationBeats: progressionLengthBeats, notes }
  const midiFile = scaled.exportMidi({
    clip,
    tempo: project.bpm,
    ticksPerBeat: TICKS_PER_BEAT,
    fileName: getFileName(project)
  })

  downloadMidiFile(midiFile)
}

const CHORD_EXPORT_VELOCITY = 80

export const exportChordsAsMidi = (project: ProjectT) => {
  const hasNoChords = project.progressionChords.length === 0
  if (hasNoChords) return console.warn('No chords to export')

  const voicedChords = voiceProgression(project.progressionChords, project.octave)

  let startBeat = 0
  const notes: PerformanceNoteT[] = []

  for (const item of project.progressionChords) {
    const voicedChord = voicedChords.get(item.id)
    if (voicedChord) {
      voicedChord.midiNotes.forEach((midiNote, noteIndex) => {
        notes.push({
          id: `${item.id}-${noteIndex}`,
          midiNote,
          startBeat,
          durationBeats: item.durationBeats,
          velocity: CHORD_EXPORT_VELOCITY,
          chordId: item.id,
          eventId: `${item.id}-${noteIndex}`
        })
      })
    }
    startBeat += item.durationBeats
  }

  const clip = { durationBeats: startBeat, notes }
  const midiFile = scaled.exportMidi({
    clip,
    tempo: project.bpm,
    ticksPerBeat: TICKS_PER_BEAT,
    fileName: getFileName(project, 'Chords')
  })

  downloadMidiFile(midiFile)
}
