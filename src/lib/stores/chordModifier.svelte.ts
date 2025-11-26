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
  minVelocity: number
  maxVelocity: number
}

class ChordModifierStore {
  state: ChordModifierStateT = $state({
    isOpen: false,
    chordId: null,
    source: null,
    octaveOffset: 0,
    inversion: 0,
    voicing: 'closed',
    minVelocity: 60,
    maxVelocity: 75
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
    this.state.minVelocity = gridChord.minVelocity
    this.state.maxVelocity = gridChord.maxVelocity
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
    this.state.minVelocity = progressionChord.minVelocity
    this.state.maxVelocity = progressionChord.maxVelocity
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

  updateMinVelocity = (value: number) => {
    this.state.minVelocity = value
    this.saveToProgressionIfNeeded()
    this.playCurrentChord()
  }

  updateMaxVelocity = (value: number) => {
    this.state.maxVelocity = value
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
        voicing: this.state.voicing,
        minVelocity: this.state.minVelocity,
        maxVelocity: this.state.maxVelocity
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
        voicing: this.state.voicing,
        minVelocity: this.state.minVelocity,
        maxVelocity: this.state.maxVelocity
      })
    }
  }

  private playCurrentChord = () => {
    const chord = this.currentChord
    if (!chord) return

    // Play the chord
    playbackStore.playChord(chord.notes)

    // Stop after 300ms
    setTimeout(() => {
      chord.notes.forEach((note) => {
        playbackStore.stopNote({ note })
      })
    }, 300)
  }

  private applyModifiersToChord = (baseChord: ChordT): ChordT => {
    // Apply voicing and inversion
    let modifiedChord = applyVoicingAndInversion({
      chord: baseChord,
      voicing: this.state.voicing,
      inversion: this.state.inversion
    })

    // Apply octave offset by transposing all notes
    const octaveOffset = this.state.octaveOffset
    if (octaveOffset !== 0) {
      const interval =
        octaveOffset > 0 ? `${octaveOffset * 7 + 1}P` : `-${Math.abs(octaveOffset) * 7 + 1}P`
      modifiedChord.notes = modifiedChord.notes.map((note) => Note.transpose(note, interval))
      modifiedChord.bassNote = Note.transpose(modifiedChord.bassNote, interval)
    }

    // Apply velocity and modifier values
    modifiedChord.minVelocity = this.state.minVelocity
    modifiedChord.maxVelocity = this.state.maxVelocity
    modifiedChord.octaveOffset = this.state.octaveOffset
    modifiedChord.inversion = this.state.inversion
    modifiedChord.voicing = this.state.voicing

    return modifiedChord
  }
}

const chordModifierStore = new ChordModifierStore()
export { chordModifierStore }
