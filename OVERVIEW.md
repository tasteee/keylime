## Overall behavior

The system lets users build a MIDI pattern using **relative note labels** instead of real notes. That pattern is then **repeated and adapted** to match a longer chord progression. At playback time, every pattern note is converted into a real MIDI note based on **which chord is active at that moment**.

Think of it as:
**“Draw a rhythm once, let the chords decide the notes.”**

---

## Chords and timing

A progression is a timeline made of chords, each lasting a certain number of beats. At any point in playback, there is always one “current” chord.

When a pattern note is about to play, the engine looks at the timeline and asks:

> “Which chord is active at this exact beat?”

That chord is the only thing used to decide what note gets played.

---

## Chord notes (no theory required)

Each chord is expanded into a **list of notes in order**, lowest to highest.
This list already accounts for:

- the chord type (major, minor, etc.)
- the voicing (open, closed, drop2, etc.)
- the inversion

Example:

- A C major chord might expand to:
  `C3, E3, G3`
- A different voicing might expand to:
  `E3, G3, C4`

This ordered list is the reference that all pattern notes use.

---

## What a signal means

A signal is **not a note**.
A signal says:

> “Play the Nth note of the current chord, at this time, for this long.”

Examples:

- `N1` → first note of the current chord
- `N2` → second note
- `N3` → third note

So if the current chord expands to `C3, E3, G3`:

- `N1` plays `C3`
- `N2` plays `E3`
- `N3` plays `G3`

If the chord changes, the same signal automatically plays a different pitch.

---

## What happens when N is larger than the chord

If a signal asks for a note that the chord doesn’t have, the system **wraps around** and goes up an octave.

Example with a 3-note chord:

- `N4` → same as `N1`, but one octave higher
- `N5` → same as `N2`, but one octave higher
- `N6` → same as `N3`, but one octave higher

So with `C3, E3, G3`:

- `N4` → `C4`
- `N5` → `E4`
- `N6` → `G4`

This makes higher N values feel like “continuing upward” instead of breaking.

---

## Octave modifiers (+1 / -1)

Signals can explicitly shift octaves.

Examples:

- `N2+1` → second note of the chord, one octave higher
- `N3-1` → third note of the chord, one octave lower

Octave modifiers are applied **after** wrapping.

So with `C3, E3, G3`:

- `N2+1` → `E4`
- `N4-1` → wraps to `C4`, then down → `C3`

This lets users shape contour without caring about real pitches.

---

## Pattern looping over the progression

Patterns are short. Progressions are longer.

To play them together:

- The pattern is repeated over and over
- Playback continues until the full progression length is covered

Each time a pattern loops:

- Signal times are shifted forward
- Signals are resolved again using whatever chord is active at that moment

If a chord changes halfway through a pattern loop, signals after that point automatically use the new chord.

---

## Final playback result

Before playback actually starts:

- The system converts the pattern + progression into a flat list of real MIDI notes
- Each note has:
  - an absolute start time
  - a duration
  - a concrete pitch
  - a velocity

Once generated, playback is no different from playing a normal MIDI clip.

---

## Why this exists (implicit)

This model allows users to:

- Write a rhythm once
- Change chords freely
- Try different voicings or inversions
- Keep musical intent intact without re-editing notes

For a DAW engineer, the key idea is:

> The vertical axis of the editor is **“note position inside the chord”**, not pitch.

Everything else follows from that.
