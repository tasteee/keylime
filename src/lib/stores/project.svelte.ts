class ProjectStore {
  id = $state(crypto.randomUUID())
  title = $state('New Project')
  description = $state('')
  userId = $state('')
  key = $state('C')
  scale = $state('Major')
  octave = $state(3)
  bpm = $state(108)

  createdAt = $state<Date | null>(new Date())
  updatedAt = $state<Date | null>(new Date())

  isSaved = $state(false)
  isDirty = $state(false)
  isPublic = $state(false)
  isPublished = $state(false)

  pattern = {

  }

  progressionChords = $state<ProgressionChordT[]>([])
  progressionDuration = $state(16) // in bars

  patternSignals = $state<PatternSignalT[]>([])
  patternSignalRows = $state<PatternSignalRowT[]>([])
  patternActiveSignals = $state([] as PatternSignalT[])
  patternLengthBeats = $state(4) // in beats

}

/*
TIMING MODEL:
All timing throughout the app is stored in BEATS (can be decimal values).
- 1 bar = 4 beats
- A signal at startTime 0.25 is 1/4 beat into the pattern
- A chord with duration 2 is 2 beats (half a bar) long

Beats are only converted to other units at the output stage:
- Playback: beats → milliseconds (using BPM)
- MIDI export: beats → ticks (128 ticks per beat)

EXAMPLE:
If the pattern is 4 beats long (1 bar) with signals at beats 0, 0.25, 0.5, 0.75,
and the progression is 16 beats long (4 bars),
then the pattern repeats 4 times during the progression.

If the progression is [C Major 4 beats, Dm 4 beats, Fmaj7 6 beats, F Major 2 beats]:
- Signal at beat 0 plays at beats 0, 4, 8, 12 (C Major, Dm, Fmaj7, Fmaj7)
- Signal at beat 0.25 plays at beats 0.25, 4.25, 8.25, 12.25
- etc.

STEPS:
1. Calculate how many times the pattern repeats to fill the progression duration
2. For each repeat, calculate the offset in beats
3. For each signal in the pattern:
  a. Calculate the absolute time in the progression timeline (offset + signal.startTime)
  b. Find which chord is active at that absolute time
  c. Map the signal to the note in that chord based on the signal row
4. Collect all these mapped notes into the performance array
5. Return the performance array
*/