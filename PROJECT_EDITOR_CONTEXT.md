# Project Editor Context Architecture

## Overview

The project editor uses a **single unified context** approach for managing project state. This provides a clean, predictable, and performant way to share project data across all components in the editor.

## Architecture Decision

### Why Single Context?

1. **Svelte 5 Performance** - Svelte's reactivity is highly optimized. Updates to nested objects/arrays are not a performance concern for typical project sizes.

2. **Single Source of Truth** - One context makes it easier to reason about state flow and debug issues.

3. **Simpler Mental Model** - Components access one context instead of juggling multiple context keys.

4. **Type Safety** - Strong typing for the entire project state and all operations.

5. **Avoid Premature Optimization** - Splitting into multiple contexts adds complexity without measurable benefit unless profiling shows actual performance issues.

## Usage Pattern

### In ContextFrame.svelte (Setup)

```svelte
<script lang="ts">
  import { setContext } from 'svelte'
  import { useProjectEditor } from '$lib/modules/useProjectEditor'

  // Create state
  const editorState = $state({
    project: {...},
    isLoading: false,
    isSaving: false,
    isDirty: false,
    cleanProjectSnapshot: ''
  })

  // Create context with state and methods
  const context = {
    state: editorState,
    updateProject,
    addProgressionChord,
    save,
    // ... other methods
  }

  setContext('projectEditor', context)
</script>

<slot />
```

### In Child Components (Access)

```svelte
<script lang="ts">
  import { useProjectEditor } from '$lib/modules/useProjectEditor'

  const projectEditor = useProjectEditor()
  const project = $derived(projectEditor.state.project)

  const handleUpdate = () => {
    projectEditor.updateProject({ title: 'New Title' })
  }
</script>

<div>{project.title}</div>
```

## Migration Guide

### Before (Class Store)

```svelte
<script lang="ts">
  import projectStore from '$lib/stores/project.svelte'

  const handleUpdate = () => {
    projectStore.title = 'New Title'
    projectStore.markDirty()
  }
</script>

<div>{projectStore.title}</div>
```

### After (Context)

```svelte
<script lang="ts">
  import { useProjectEditor } from '$lib/modules/useProjectEditor'

  const projectEditor = useProjectEditor()
  const project = $derived(projectEditor.state.project)

  const handleUpdate = () => {
    projectEditor.updateProject({ title: 'New Title' })
  }
</script>

<div>{project.title}</div>
```

## Available Methods

### Project Updates

- `updateProject(updates: Partial<ProjectT>)` - Update any project properties
- `save()` - Save project to database
- `saveClone()` - Save as new cloned project
- `checkIsDirty()` - Check if project has unsaved changes

### Progression Operations

- `addProgressionChord(chord: ChordT)` - Add chord to progression
- `addProgressionRest()` - Add rest to progression
- `removeProgressionItem(id: string)` - Remove item from progression
- `updateProgressionItem(updates: Partial<ProgressionItemT>)` - Update progression item
- `duplicateProgressionItem(id: string)` - Duplicate existing item
- `reorderProgressionItem({ itemId, newIndex })` - Reorder items

### Pattern Signal Operations

- `addPatternSignal(signal: SignalT)` - Add new signal
- `updatePatternSignal(signalId, updates)` - Update existing signal
- `removePatternSignal(signalId)` - Remove signal
- `movePatternSignalToRow({ signalId, fromRowId, toRowId })` - Move signal between rows

## Dirty State Tracking

The context automatically tracks changes by comparing JSON snapshots of the project state (excluding `createdAt` and `updatedAt` timestamps).

```typescript
const createCleanSnapshot = (project: ProjectT): string => {
	const { createdAt, updatedAt, ...rest } = project
	return JSON.stringify(rest)
}

const checkIsDirty = (): boolean => {
	const currentSnapshot = createCleanSnapshot(editorState.project)
	return currentSnapshot !== editorState.cleanProjectSnapshot
}
```

After successful save, the snapshot is updated:

```typescript
editorState.cleanProjectSnapshot = createCleanSnapshot(syncedProject)
editorState.isDirty = false
```

## Performance Considerations

### When Updates Trigger Re-renders

Svelte's fine-grained reactivity means:

- Only components that read the specific changed value will re-render
- Derived values (`$derived`) automatically update when dependencies change
- Object/array mutations are properly tracked

### Example: Updating a Chord

```typescript
// This only re-renders components that read progressionChords
projectEditor.updateProgressionItem({
	id: 'chord-1',
	durationBeats: 8
})
```

Components reading `project.title` or `project.bpm` won't re-render.

### When to Consider Splitting

Only split the context if profiling shows:

1. Many components unnecessarily re-rendering
2. Measurable performance degradation
3. Very large data sets (thousands of items)

For typical music projects (dozens of chords, hundreds of signals), the single context is optimal.

## Best Practices

1. **Use $derived for computed values**

   ```typescript
   const totalDuration = $derived(project.progressionChords.reduce((sum, chord) => sum + chord.durationBeats, 0))
   ```

2. **Create local derived projections**

   ```typescript
   // Only re-renders when progressionChords changes
   const chordCount = $derived(project.progressionChords.length)
   ```

3. **Batch related updates**

   ```typescript
   // Good: Single update
   projectEditor.updateProject({
   	title: 'New Title',
   	bpm: 140,
   	key: 'Am'
   })

   // Avoid: Multiple separate updates
   projectEditor.updateProject({ title: 'New Title' })
   projectEditor.updateProject({ bpm: 140 })
   projectEditor.updateProject({ key: 'Am' })
   ```

4. **Keep computed logic in components**
   - Don't add derived state to the context unless shared by many components
   - Let each component derive what it needs

## Error Handling

All async methods (save, load) throw errors. Handle them in components:

```typescript
const handleSave = async () => {
	try {
		await projectEditor.save()
		// Show success message
	} catch (error) {
		// Show error dialog
		console.error('Save failed:', error)
	}
}
```

## Type Safety

The context is fully typed:

```typescript
type ProjectEditorContextT = {
	state: ProjectEditorStateT
	updateProject: (updates: Partial<ProjectT>) => void
	// ... all methods with full type signatures
}
```

TypeScript will catch incorrect usage at compile time.
