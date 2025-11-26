import mainStore from './main.svelte'
import chordsByScale from '$lib/constants/chordsByScale.json'
import { generateChord } from '$lib/helpers/chords'

type GridChordModifiersT = {
  octaveOffset: number
  inversion: number
  voicing: VoicingT
  minVelocity: number
  maxVelocity: number
}

type GridChordMapT = {
  [chordId: string]: GridChordModifiersT
}

class GridChordsStore {
  chordModifiers = $state({}) as GridChordMapT

  gridChords = $derived.by(() => {
    const scale = mainStore.selectedKey + ' ' + mainStore.selectedScale
    const inScaleChordNames = chordsByScale[scale as keyof typeof chordsByScale]

    const chords: ChordT[] = inScaleChordNames.map((name) => {
      const chordId = this.getChordIdForName(name)
      const modifiers = this.chordModifiers[chordId] || this.getDefaultModifiers()

      const baseChord = generateChord({
        name,
        baseOctave: mainStore.rootOctave
      })

      const chord: ChordT = {
        ...baseChord,
        id: chordId,
        octaveOffset: modifiers.octaveOffset,
        inversion: modifiers.inversion,
        voicing: modifiers.voicing,
        minVelocity: modifiers.minVelocity,
        maxVelocity: modifiers.maxVelocity
      }

      return chord
    })

    return chords
  })

  getChordIdForName = (name: string): string => {
    const scale = mainStore.selectedKey + ' ' + mainStore.selectedScale
    return `grid-${scale}-${name}`
  }

  getDefaultModifiers = (): GridChordModifiersT => {
    return {
      octaveOffset: 0,
      inversion: 0,
      voicing: 'closed',
      minVelocity: 60,
      maxVelocity: 75
    }
  }

  updateChordModifiers = (args: {
    chordId: string
    octaveOffset?: number
    inversion?: number
    voicing?: VoicingT
    minVelocity?: number
    maxVelocity?: number
  }) => {
    const currentModifiers = this.chordModifiers[args.chordId] || this.getDefaultModifiers()

    this.chordModifiers[args.chordId] = {
      octaveOffset: args.octaveOffset ?? currentModifiers.octaveOffset,
      inversion: args.inversion ?? currentModifiers.inversion,
      voicing: args.voicing ?? currentModifiers.voicing,
      minVelocity: args.minVelocity ?? currentModifiers.minVelocity,
      maxVelocity: args.maxVelocity ?? currentModifiers.maxVelocity
    }
  }

  getChord = (chordId: string): ChordT | undefined => {
    return this.gridChords.find((chord) => chord.id === chordId)
  }
}

const gridChordsStore = new GridChordsStore()
export default gridChordsStore
