import playbackStore from './playback.svelte'
import { progressionStore } from './progression.svelte'
import gridChordsStore from './gridChords.svelte'
import { generateChord, applyVoicingAndInversion } from '$lib/helpers/chords'
import { Note } from 'tonal'

type ChordSourceT = 'grid' | 'progression'

type ChordModifierStateT = {
  isOpen: boolean
  chordId: string | null
  source: ChordSourceT | null
  // Modifiers (used by both grid and progression chords)
  octaveOffset: number
  inversion: number
  voicing: VoicingT
}

class ChordModifierStore {
  state: ChordModifierStateT = $state({
    isOpen: false,
    chordId: null,
    source: null,
    octaveOffset: 0,
    inversion: 0,
    voicing: 'closed'
  })

  // Get the current chord being modified (fully computed with all modifications)
  currentChord = $derived.by(() => {
    const isModifierOpen = this.state.isOpen
    if (!isModifierOpen) return null

    const isProgressionChord = this.state.source === 'progression'
    if (isProgressionChord) {
      const progressionChord = progressionStore.getChord(this.state.chordId!)
      if (!progressionChord) return null

      // Return the progression chord with current modifier values applied
      return this.applyModifiersToChord(progressionChord)
    }

    const isGridChord = this.state.source === 'grid'
    if (isGridChord) {
      const gridChord = gridChordsStore.getChord(this.state.chordId!)
      if (!gridChord) return null

      // Return the grid chord with current modifier values applied
      return this.applyModifiersToChord(gridChord)
    }

    return null
  })

  openForGridChord = (args: { chordId: string }) => {
    const gridChord = gridChordsStore.getChord(args.chordId)
    if (!gridChord) return

    this.state.isOpen = true
    this.state.chordId = args.chordId
    this.state.source = 'grid'
    // Load existing modifiers from the grid chord
    this.state.octaveOffset = gridChord.octaveOffset
    this.state.inversion = gridChord.inversion
    this.state.voicing = gridChord.voicing as VoicingT
  }

  openForProgressionChord = (args: { chordId: string }) => {
    const progressionChord = progressionStore.getChord(args.chordId)
    if (!progressionChord) return

    this.state.isOpen = true
    this.state.chordId = args.chordId
    this.state.source = 'progression'
    // Load existing modifiers from the progression chord
    this.state.octaveOffset = progressionChord.octaveOffset
    this.state.inversion = progressionChord.inversion
    this.state.voicing = progressionChord.voicing as VoicingT
  }

  closeDialog = () => {
    this.state.isOpen = false
    this.state.chordId = null
    this.state.source = null
  }

  updateOctaveOffset = (value: number) => {
    this.state.octaveOffset = value
    this.saveToProgressionIfNeeded()
    this.playCurrentChord()
  }

  updateInversion = (value: number) => {
    this.state.inversion = value
    this.saveToProgressionIfNeeded()
    this.playCurrentChord()
  }

  updateVoicing = (value: VoicingT) => {
    this.state.voicing = value
    this.saveToProgressionIfNeeded()
    this.playCurrentChord()
  }

  private saveToProgressionIfNeeded = () => {
    const isProgressionChord = this.state.source === 'progression'
    if (isProgressionChord) {
      const chordId = this.state.chordId
      if (!chordId) return

      progressionStore.updateChord({
        id: chordId,
        octaveOffset: this.state.octaveOffset,
        inversion: this.state.inversion,
        voicing: this.state.voicing
      })
      return
    }

    const isGridChord = this.state.source === 'grid'
    if (isGridChord) {
      const chordId = this.state.chordId
      if (!chordId) return

      gridChordsStore.updateChordModifiers({
        chordId,
        octaveOffset: this.state.octaveOffset,
        inversion: this.state.inversion,
        voicing: this.state.voicing
      })
    }
  }

  private playCurrentChord = () => {
    const chord = this.currentChord
    if (!chord) return

    // Play the chord for 500ms
    playbackStore.playChord(chord, 500)
  }

  private applyModifiersToChord = (baseChord: ChordT): ChordT => {
    // Return chord with current modifier values
    return {
      ...baseChord,
      octaveOffset: this.state.octaveOffset,
      inversion: this.state.inversion,
      voicing: this.state.voicing
    }
  }
}

const chordModifierStore = new ChordModifierStore()
export { chordModifierStore }
