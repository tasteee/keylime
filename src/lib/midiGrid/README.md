# midiGrid

The piano-roll style editor for a pattern. It is a port of the roll, ruler and
velocity lane from [Maddie](https://github.com/tasteee/maddie), with KeyLime's
rules on top:

- A row is a chord tone (`N1`, `N2+1`, ...), not a key. There is no keyboard,
  scale lock, or light and dark rows. Labels show the note the selected chord
  plays on that row.
- The loop is always on. Its end is the length of the pattern
  (`patternDurationBars`). Drag it on the ruler.
- The project is the source of truth. The grid edits notes, then hands them
  back through `onCommit`. Undo and redo stay in `ContextFrame`.

## How data flows

```
project.patternSignals + patternSignalRows
        │  convertSignalsToNotes (signalAdapter.ts)
        ▼
   editor (editor.ts)  ◄── gestures (rollGestures.ts), keys (keymap.ts), commands.ts
        │  applyChanges → newest note wins any overlap in its row (overlaps.ts)
        │  onCommit
        ▼
convertNotesToPattern → projectEditor.updateProject(...)
```

If the project changes from outside the grid (undo, a library pattern), the
note signature no longer matches the last one the grid wrote, and the grid
reloads from the project.

## Units

Time is in ticks (960 per beat) inside the grid, and in beats in the project.
One cell is a 1/16 note (240 ticks). Pitch 0 is the bottom row (`N1-2`) and
pitch 39 is the top row (`N8+2`).

## Controls

| Action | Input |
| --- | --- |
| Add a note | Double-click empty grid |
| Delete a note | Double-click it, or select and press Delete / Backspace |
| Select | Click a note, or drag a box on empty grid. Shift / Ctrl / Cmd adds |
| Move | Drag (Shift locks one axis, Alt ignores the grid, Ctrl / Cmd drags a copy) |
| Move with keys | Arrow keys. Shift + Up / Down moves a whole band of eight rows |
| Resize | Drag an edge, or Ctrl / Cmd (or Shift) + Left / Right |
| Velocity | Right-click a note and drag up or down, Alt + Up / Down, or the velocity lane |
| Turn off / on | `0` |
| Copy / cut / paste / duplicate | Ctrl / Cmd + C / X / V / D (paste lands at the cursor) |
| Select all / deselect | Ctrl / Cmd + A / Escape |
| Pattern length | Drag the loop end on the ruler, or click the strip above the bar numbers |
| Scroll / zoom | Wheel, Shift + wheel, Ctrl / Cmd + wheel, middle-drag to pan |
