<script lang="ts">
	import { getContext, onMount } from 'svelte'
	import PanelHeader from './PanelHeader.svelte'
	import PatternGrid from './PatternGrid.svelte'
	import PatternLibrarySelect from './PatternLibrarySelect.svelte'
	import SelectPatternLength from './SelectPatternLength.svelte'
	import { MagnifyingGlassPlus, MagnifyingGlassMinus, Gear } from 'phosphor-svelte'
	import { createPatternEditor, type AuditionArgsT } from '$lib/midiGrid/editor'
	import {
		MAX_CELL_PIXELS,
		MAX_ROW_HEIGHT,
		MIN_CELL_PIXELS,
		MIN_ROW_HEIGHT,
		TICKS_PER_BEAT,
		VELOCITY_LANE_HEIGHT
	} from '$lib/midiGrid/constants'
	import { getRowIdForPitch } from '$lib/midiGrid/rows'
	import {
		convertNotesToPattern,
		convertSignalsToNotes,
		createNotesSignature
	} from '$lib/midiGrid/signalAdapter'
	import { clampLoopEndTick, convertBarsToTicks, convertTicksToBars, clampNumber } from '$lib/midiGrid/time'
	import type { NoteT } from '$lib/midiGrid/types'
	import { SIGNAL_IDS } from '$lib/constants/signalRows'
	import { getSignalRowMidiNotes } from '$lib/helpers/signalRows'
	import { getVoicedChord, midiToNoteName } from '$lib/music'
	import { getPatternBeat } from '$lib/helpers/performance'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import playbackStore from '$lib/stores/playback.svelte'

	const projectEditor = useProjectEditor()
	const playbackContext = getContext<PlaybackContextT>('playback')

	const PATTERN_ZOOM_STEP = 4
	const AUDITION_MS = 300
	const editorStyle = `--lane-height: ${VELOCITY_LANE_HEIGHT}px`

	const project = $derived(projectEditor.state.project)
	const doesPatternReset = $derived(Boolean(project.doesPatternResetOnChordChange))

	const handleResetOnChordChange = (event: CustomEvent) => {
		const isChecked: boolean = event.detail.checked
		projectEditor.updateProject({ doesPatternResetOnChordChange: isChecked })
	}

	// ---- Which note each row plays ----

	const progressionItems = $derived.by(() => {
		let accumulatedStartTime = 0
		return project.progressionChords.map((item) => {
			const startTime = accumulatedStartTime
			accumulatedStartTime += item.durationBeats
			return { ...item, startTime } as ProgressionItemT
		})
	})

	const selectedChord = $derived.by(() => {
		const selectedId = projectEditor.state.selectedProgressionItemId
		if (!selectedId) return null
		const chords = progressionItems.filter((item): item is ProgressionChordT => item.type === 'chord')
		return chords.find((chord) => chord.id === selectedId) ?? null
	})

	// Row id to MIDI note, for the selected chord.
	const signalRowNotes = $derived.by(() => {
		if (!selectedChord) return new Map<string, number>()
		const voicedChord = getVoicedChord({ chord: selectedChord, octave: project.octave })
		return getSignalRowMidiNotes(voicedChord)
	})

	const rowNoteNames = $derived.by(() => {
		const names = new Map<string, string>()
		for (const rowId of SIGNAL_IDS) {
			const midiNote = signalRowNotes.get(rowId)
			if (midiNote === undefined) continue
			names.set(rowId, midiToNoteName(midiNote))
		}
		return names
	})

	// ---- Sound ----

	const auditionPitch = (args: AuditionArgsT) => {
		const rowId = getRowIdForPitch(args.pitch)
		const midiNote = signalRowNotes.get(rowId)
		if (midiNote === undefined) return

		const midiVelocity = clampNumber({ value: Math.round(args.velocity * 127), min: 1, max: 127 })
		playbackStore.playNote({ note: midiNote, velocity: midiVelocity })
		setTimeout(() => playbackStore.stopNote({ note: midiNote }), AUDITION_MS)
	}

	let heldLabelNote: number | null = null

	const stopHeldLabelNote = () => {
		if (heldLabelNote === null) return
		playbackStore.stopNote({ note: heldLabelNote })
		heldLabelNote = null
	}

	const handleRowPress = (rowId: string) => {
		const midiNote = signalRowNotes.get(rowId)
		if (midiNote === undefined) return
		if (midiNote === heldLabelNote) return

		stopHeldLabelNote()
		heldLabelNote = midiNote
		playbackStore.playNote({ note: midiNote })
	}

	// ---- The grid, and keeping it in step with the project ----

	// The last notes the grid and the project agreed on. If the project
	// shows something else, it changed from outside (undo, a library pattern).
	let lastSyncedSignature = ''

	const handleCommit = (notes: NoteT[]) => {
		lastSyncedSignature = createNotesSignature(notes)
		const pattern = convertNotesToPattern({ notes, previousSignals: project.patternSignals })
		projectEditor.updateProject({
			patternSignals: pattern.patternSignals,
			patternSignalRows: pattern.patternSignalRows
		})
	}

	const handleLoopEndChange = (loopEndTick: number) => {
		projectEditor.updateProject({ patternDurationBars: convertTicksToBars(loopEndTick) })
	}

	const editor = createPatternEditor({
		onCommit: handleCommit,
		onLoopEndChange: handleLoopEndChange,
		onAudition: auditionPitch
	})

	const readProjectNotes = (): NoteT[] => {
		const middleMidiVelocity = (project.minVelocity + project.maxVelocity) / 2
		const defaultVelocity = clampNumber({ value: middleMidiVelocity / 127, min: 0, max: 1 })
		return convertSignalsToNotes({
			signals: project.patternSignals,
			signalRows: project.patternSignalRows,
			defaultVelocity
		})
	}

	$effect(() => {
		const notes = readProjectNotes()
		const signature = createNotesSignature(notes)
		const isUpToDate = signature === lastSyncedSignature
		if (isUpToDate) return

		lastSyncedSignature = signature
		editor.replaceNotes(notes)
	})

	$effect(() => {
		const loopEndTick = clampLoopEndTick(convertBarsToTicks(project.patternDurationBars))
		editor.setLoopEndTick(loopEndTick)
	})

	// The saved zoom level is the width of a cell. It is dragged on the ruler.
	$effect(() => {
		const zoomLevel = project.patternZoomLevel
		const ticksPerCell = TICKS_PER_BEAT / 4
		editor.setView({ pxPerTick: zoomLevel / ticksPerCell })
	})

	// Row height is dragged on the row labels. It starts level with the cell width.
	onMount(() => {
		const startingRowHeight = clampNumber({ value: project.patternZoomLevel, min: MIN_ROW_HEIGHT, max: MAX_ROW_HEIGHT })
		editor.setView({ rowHeight: startingRowHeight })
	})

	const handleCellPixelsChange = (cellPixels: number) => {
		const patternZoomLevel = clampNumber({ value: cellPixels, min: MIN_CELL_PIXELS, max: MAX_CELL_PIXELS })
		projectEditor.updateProject({ patternZoomLevel })
	}

	// The buttons and the wheel zoom both axes together.
	const changeZoom = (direction: 1 | -1) => {
		const step = direction * PATTERN_ZOOM_STEP
		handleCellPixelsChange(project.patternZoomLevel + step)

		const nextRowHeight = editor.getView().rowHeight + step
		const rowHeight = clampNumber({ value: nextRowHeight, min: MIN_ROW_HEIGHT, max: MAX_ROW_HEIGHT })
		editor.setView({ rowHeight })
	}

	const zoomInPattern = () => changeZoom(1)
	const zoomOutPattern = () => changeZoom(-1)

	// ---- Playhead ----

	let playheadFrameId = 0

	const updatePlayhead = () => {
		const isPlaying = playbackContext.state.isPlaying
		if (!isPlaying) return

		const elapsedMs = performance.now() - playbackContext.state.loopStartTime
		const msPerBeat = 60000 / project.bpm
		const currentBeat = elapsedMs / msPerBeat
		const patternLengthBeats = project.patternDurationBars * 4

		const loopedBeat = getPatternBeat({
			beat: currentBeat,
			patternLengthBeats,
			chords: progressionItems,
			doesPatternResetOnChordChange: doesPatternReset
		})

		editor.setPlayheadTick(Math.round(loopedBeat * TICKS_PER_BEAT))
		playheadFrameId = requestAnimationFrame(updatePlayhead)
	}

	$effect(() => {
		const isPlaying = playbackContext.state.isPlaying
		if (isPlaying) playheadFrameId = requestAnimationFrame(updatePlayhead)
		if (!isPlaying) editor.setPlayheadTick(null)
		return () => cancelAnimationFrame(playheadFrameId)
	})

	onMount(() => {
		return () => stopHeldLabelNote()
	})
</script>

<div class="pattern-editor" style={editorStyle}>
	<PanelHeader label="Pattern" />

	<PatternGrid
		{editor}
		{rowNoteNames}
		onRowPress={handleRowPress}
		onRowRelease={stopHeldLabelNote}
		onZoomStep={changeZoom}
		onCellPixelsChange={handleCellPixelsChange}
	/>

	<div class="pattern-floating-controls">
		<PatternLibrarySelect placement="top-end" />

		<z-button-group>
			<z-button kind="outline" size="sm" onclick={zoomOutPattern} aria-label="Zoom out">
				<MagnifyingGlassMinus size={16} weight="bold" />
			</z-button>
			<z-button kind="outline" size="sm" onclick={zoomInPattern} aria-label="Zoom in">
				<MagnifyingGlassPlus size={16} weight="bold" />
			</z-button>
		</z-button-group>

		<z-popover placement="top-end">
			<z-button slot="trigger" kind="outline" size="sm" aria-label="Pattern settings">
				<Gear size={16} />
			</z-button>

			<z-column gap="md" class="pattern-settings-panel">
				<SelectPatternLength />
				<z-tooltip content="Restart the pattern at the start of every chord" placement="top">
					<z-switch size="sm" isChecked={doesPatternReset} onchange={handleResetOnChordChange}>Reset on chord change</z-switch>
				</z-tooltip>
			</z-column>
		</z-popover>
	</div>
</div>

<style>
	/* A rounded segment of the page, not the frame of it. */
	.pattern-editor {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		margin: var(--spacing-3) var(--spacing-4) 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--card);
		overflow: hidden;
	}

	/* Floats over the bottom right of the note grid, above the velocity lane. */
	.pattern-floating-controls {
		position: absolute;
		right: var(--spacing-5);
		bottom: calc(var(--lane-height) + var(--spacing-5));
		z-index: 10;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}

	.pattern-settings-panel {
		min-width: 14rem;
	}
</style>
