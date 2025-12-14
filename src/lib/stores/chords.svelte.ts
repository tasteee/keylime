import chordsByScale from '$lib/constants/chordsByScale.json'
import mainStore from '$lib/stores/main.svelte'
import { applyVoicingAndInversion, generateChord } from '$lib/helpers/chords'
import { Note } from 'tonal'

class ChordsStore {
  gridChords = $derived.by(() => {
    const scale = mainStore.selectedKey + ' ' + mainStore.selectedScale
    const inScaleChordNames = $derived(chordsByScale[scale as keyof typeof chordsByScale])
    const baseOctave = mainStore.rootOctave
    const chords = inScaleChordNames.map((chordName) => generateChord({ name: chordName, baseOctave }))
    return chords
  }) as ChordT[]

  progressionBaseChords = $state([]) as ChordT[]

  progressionChords = $derived.by(() => {
    return this.progressionBaseChords.map((chord) => {
      return { ...chord }
    })
  }) as ChordT[]
}