import KEYMAPS_CONFIG from '$lib/constants/keymaps.json';
import { scaled, midiToNoteName } from '$lib/music';

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
    const maxKeys = 45; // QWERTY keyboard key count
    const maxOctave = 12;
    const scale = scaled.getScale({ key: this.selectedKey, scale: this.selectedScale });
    // Scale notes as semitones above the key's note, which is the lowest note on the keyboard.
    const tonicPitch = scale.tonicPitch;
    const semitonesAboveTonic = scale.pitches.map((pitch) => (pitch - tonicPitch + 12) % 12);
    const notes: string[] = [];

    for (
      let octave = Number(this.rootOctave);
      octave <= maxOctave && notes.length < maxKeys;
      octave++
    ) {
      // MIDI note of the key's note in this octave (C4 = 60).
      const tonicMidiNote = (octave + 1) * 12 + tonicPitch;
      for (const semitones of semitonesAboveTonic) {
        if (notes.length >= maxKeys) break;
        notes.push(midiToNoteName(tonicMidiNote + semitones));
      }
    }

    return notes;
  });
}

export const keyboardStore = new KeyboardStore();
