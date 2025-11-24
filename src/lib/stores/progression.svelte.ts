import { SIGNAL_IDS, SIGNAL_ROWS } from '$lib/constants/signalRows'
import { resolveChordConflicts } from '$lib/helpers/progression'

// Total progression grid is divided into 64 units
// Each unit = 1/64 of the progression width
const TOTAL_UNITS = 64

class ProgressionStore {
  chords: ChordT[] = $state([])
  selectedChordId: string | null = $state(null)

  getChord = (id: string): ChordT | undefined => {
    const finder = (c: ChordT) => c.id === id
    return this.chords.find(finder)
  }

  addChord = (chord: ChordT) => {
    // Calculate the end time of the last chord in the progression
    const lastChord = this.chords[this.chords.length - 1]
    const lastChordEndTime = lastChord
      ? (lastChord.startTime ?? 0) + (lastChord.duration ?? 0)
      : 0

    // Set default timeline properties
    // Default duration is based on durationBeats: 1 beat = 16 units (1/4 of total)
    const chordWithTimelineData: ChordT = {
      ...chord,
      startTime: lastChordEndTime,
      duration: chord.durationBeats * 16, // 1 beat = 16 units (16/64 = 1/4)
      modifiedTime: Date.now()
    }

    this.chords = [...this.chords, chordWithTimelineData]
  }

  removeChord = (id: string) => {
    this.chords = this.chords.filter((chord) => chord.id !== id)

    const wasSelected = this.selectedChordId === id
    if (wasSelected) {
      this.selectedChordId = null
    }
  }

  updateChord = (updatedChord: Partial<ChordT>) => {
    this.chords = this.chords.map((chord) =>
      chord.id === updatedChord.id ? { ...chord, ...updatedChord } : chord
    )
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

    const duplicatedChord: ChordT = {
      ...originalChord,
      id: `${originalChord.id}-${Date.now()}`,
      startTime: newStartTime,
      duration: originalDuration,
      modifiedTime: Date.now()
    }

    this.chords = [...this.chords, duplicatedChord]
    this.selectedChordId = duplicatedChord.id
    this.resolveConflictsForChord(duplicatedChord.id)
  }

  resolveConflictsForChord = (chordId: string) => {
    const newChords = resolveChordConflicts({ chords: this.chords })
    this.chords = [...this.chords, ...newChords]
  }
}

const progressionStore = new ProgressionStore()
export { progressionStore }