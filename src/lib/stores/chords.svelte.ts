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
    const currentOctave = mainStore.rootOctave

    return this.progressionBaseChords.map((chord) => {
      const octaveOffset = chord.octaveOffset

      const regeneratedChord = generateChord({
        name: chord.symbol,
        baseOctave: currentOctave
      })

      let modifiedChord = applyVoicingAndInversion({
        chord: regeneratedChord,
        voicing: chord.voicing as VoicingT,
        inversion: chord.inversion
      })

      if (octaveOffset !== 0) {
        const interval = octaveOffset > 0
          ? `${octaveOffset * 7 + 1}P`
          : `-${Math.abs(octaveOffset) * 7 + 1}P`

        modifiedChord.notes = modifiedChord.notes.map((note) => Note.transpose(note, interval))
        modifiedChord.bassNote = Note.transpose(modifiedChord.bassNote, interval)
      }

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
  }) as ChordT[]
}