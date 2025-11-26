import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'
import { resolveChordConflicts } from '$lib/helpers/progression'
import mainStore from './main.svelte'
import { generateChord, applyVoicingAndInversion } from '$lib/helpers/chords'
import { Note } from 'tonal'

// Total progression grid is divided into 64 units
// Each unit = 1/64 of the progression width
const TOTAL_UNITS = 64

class ProgressionStore {
  baseChords: ProgressionChordT[] = $state([])
  selectedChordId: string | null = $state(null)

  // Regenerate all chords with current global octave
  chords = $derived.by(() => {
    const currentOctave = mainStore.rootOctave

    return this.baseChords.map((chord) => {
      // Regenerate the base chord with current global octave
      const regeneratedChord = generateChord({
        name: chord.symbol,
        baseOctave: currentOctave
      })

      // Reapply the stored modifiers
      let modifiedChord = applyVoicingAndInversion({
        chord: regeneratedChord,
        voicing: chord.voicing as VoicingT,
        inversion: chord.inversion
      })

      // Apply octave offset by transposing all notes
      const octaveOffset = chord.octaveOffset
      if (octaveOffset !== 0) {
        const interval = octaveOffset > 0
          ? `${octaveOffset * 7 + 1}P`
          : `-${Math.abs(octaveOffset) * 7 + 1}P`
        modifiedChord.notes = modifiedChord.notes.map((note) => Note.transpose(note, interval))
        modifiedChord.bassNote = Note.transpose(modifiedChord.bassNote, interval)
      }

      // Return chord with preserved timeline data and modifiers
      return {
        ...modifiedChord,
        id: chord.id,
        startTime: chord.startTime,
        duration: chord.duration,
        durationBeats: chord.durationBeats,
        modifiedTime: chord.modifiedTime,
        minVelocity: chord.minVelocity,
        maxVelocity: chord.maxVelocity,
        octaveOffset: chord.octaveOffset,
        inversion: chord.inversion,
        voicing: chord.voicing
      }
    })
  })

  getChord = (id: string): ChordT | undefined => {
    const finder = (c: ChordT) => c.id === id
    return this.baseChords.find(finder)
  }

  getLastChordEndTime = (): number => {
    if (!this.baseChords.length) return 0
    const lastChord = this.baseChords[this.baseChords.length - 1]
    return lastChord.startTime + lastChord.duration
  }

  addChord = (chord: ChordT) => {
    const lastChordEndTime = this.getLastChordEndTime()

    const chordWithTimelineData: ProgressionChordT = {
      ...chord,
      startTime: lastChordEndTime,
      duration: chord.durationBeats, // duration in beats (same as durationBeats)
      modifiedTime: Date.now()
    }

    this.baseChords = [...this.baseChords, chordWithTimelineData]

    // Automatically select the newly added chord
    this.selectedChordId = chordWithTimelineData.id
  }

  removeChord = (id: string) => {
    const wasSelected = this.selectedChordId === id
    this.baseChords = this.baseChords.filter((chord) => chord.id !== id)

    // Only deselect if the selected chord was deleted and no chords remain
    if (wasSelected) {
      const hasChordsRemaining = this.baseChords.length > 0
      if (hasChordsRemaining) {
        // Select the last chord in the progression
        const lastChord = this.baseChords[this.baseChords.length - 1]
        this.selectedChordId = lastChord.id
      } else {
        // No chords left, deselect
        this.selectedChordId = null
      }
    }
  }

  updateChord = (updatedChord: Partial<ChordT>) => {
    this.baseChords = this.baseChords.map((chord) => {
      const isTargetChord = chord.id === updatedChord.id
      if (!isTargetChord) return chord

      const mergedChord = { ...chord, ...updatedChord }

      // Sync durationBeats when duration changes (duration is now in beats directly)
      const hasDurationUpdate = updatedChord.duration !== undefined
      if (hasDurationUpdate) {
        const MIN_DURATION_BEATS = 1 / 16
        mergedChord.durationBeats = Math.max(MIN_DURATION_BEATS, mergedChord.duration)
      }

      return mergedChord
    })
  }

  selectChord = (id: string | null) => {
    this.selectedChordId = id
  }

  deleteSelectedChord = () => {
    const hasSelectedChord = this.selectedChordId !== null
    if (hasSelectedChord) {
      this.removeChord(this.selectedChordId as string)
    }
  }

  duplicateSelectedChord = () => {
    const hasSelectedChord = this.selectedChordId !== null
    if (!hasSelectedChord) return

    const originalChord = this.getChord(this.selectedChordId as string)
    if (!originalChord) return

    const originalStartTime = originalChord.startTime ?? 0
    const originalDuration = originalChord.duration ?? 0
    const newStartTime = originalStartTime + originalDuration

    const duplicatedChord: ProgressionChordT = {
      ...originalChord,
      id: `${originalChord.id}-${Date.now()}`,
      startTime: newStartTime,
      duration: originalDuration,
      modifiedTime: Date.now()
    }

    this.baseChords = [...this.baseChords, duplicatedChord]
    this.selectedChordId = duplicatedChord.id
    this.resolveConflictsForChord(duplicatedChord.id)
  }

  resolveConflictsForChord = (chordId: string) => {
    const resolvedChords = resolveChordConflicts({ chords: this.baseChords })
    const progressionChords: ProgressionChordT[] = resolvedChords.map((chord) => {
      return {
        ...chord,
        startTime: chord.startTime ?? 0,
        duration: chord.duration ?? 0,
        modifiedTime: Date.now()
      }
    })
    this.baseChords = progressionChords
  }
}

const progressionStore = new ProgressionStore()
export { progressionStore }