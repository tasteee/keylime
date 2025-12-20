import KEYMAPS_CONFIG from '$lib/constants/keymaps.json';
import { Scale, Note } from 'tonal';

const getFinalNote = (note: string) => {
  // 1. make sure there are no DOUBLE SHARPS: F## -> G, C## -> D, etc.
  // 2. make sure there are no FLATS: Db -> C#, Eb -> D#, etc.

  const doubleSharpMap = {
    'C##': 'D',
    'D##': 'E',
    'E##': 'F#',
    'F##': 'G',
    'G##': 'A',
    'A##': 'B',
    'B##': 'C#'
  };

  const flatToSharpMap = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
    Fb: 'E',
    Cb: 'B'
  };

  const simplified = Note.simplify(note) || note;
  const octaveMatch = simplified.match(/(\d+)$/);
  const octave = octaveMatch ? octaveMatch[1] : '';
  const noteWithoutOctave = simplified.replace(/\d+$/, '');
  const correctedDoubleSharp = doubleSharpMap[noteWithoutOctave as keyof typeof doubleSharpMap];
  const correctedFlat = flatToSharpMap[noteWithoutOctave as keyof typeof flatToSharpMap];
  const finalNote = correctedDoubleSharp || correctedFlat || noteWithoutOctave;
  return finalNote + octave;
};

class KeyboardStore {
  selectedKey = $state('C');
  selectedScale = $state('Major');
  selectedKeyboardLayout = $state('standard');
  selectedKeymap = $state('rightUp') as keyof typeof KEYMAPS_CONFIG;
  selectedChordMode = $state('Off');
  isScaleLockActive = $state(true);
  currentOpenPopoverId = $state(null) as string | null;
  infoText = $state('');

  pressedNotes = $state([]) as string[];
  mousePlayingNote = $state(null) as string | null;
  rootOctave = $state('3');
  bpm = $state(108);

  keyNoteMap = $derived.by(() => {
    const keymapConfig = KEYMAPS_CONFIG[this.selectedKeymap];
    const entries = Object.entries(keymapConfig.remaps);

    const keyNoteMap = entries.reduce((map, entry) => {
      const [keyCode, noteIndex] = entry as [string, number];
      const indexedNote = this.qwertyNotes[noteIndex];
      if (indexedNote) map[keyCode] = indexedNote;
      return map;
    }, {} as any);

    return keyNoteMap;
  });

  qwertyNotes = $derived.by(() => {
    const scaleNotes = Scale.get(`${this.selectedKey} ${this.selectedScale}`).notes;
    const convertedNotes = scaleNotes.map(getFinalNote);
    const maxKeys = 45; // QWERTY keyboard key count
    const maxOctave = 12;
    const notes = [];
    const rootNote = convertedNotes[0];
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootNoteIndex = noteOrder.indexOf(rootNote);

    for (
      let octave = Number(this.rootOctave);
      octave <= maxOctave && notes.length < maxKeys;
      octave++
    ) {
      for (const note of convertedNotes) {
        if (notes.length >= maxKeys) break;
        const currentNoteIndex = noteOrder.indexOf(note);
        const shouldIncrementOctave = currentNoteIndex < rootNoteIndex;
        const finalOctave = shouldIncrementOctave ? octave + 1 : octave;
        const finalNote = getFinalNote(`${note}${finalOctave}`);
        notes.push(finalNote);
      }
    }

    return notes;
  });
}

export const keyboardStore = new KeyboardStore();
