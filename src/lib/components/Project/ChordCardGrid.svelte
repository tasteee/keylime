<script lang="ts">
	import * as Svelte from 'svelte'
	import * as ChordGridKeyboard from '$lib/helpers/chordGridKeyboard'
	import * as Typing from '$lib/helpers/typing'
	import playbackStore from '$lib/stores/playback.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { getChordRootPitch, checkIsTriad, getRomanNumeral, getScaleDegreeIndex } from '$lib/helpers/chordGridLabels'
	import ChordCard from './ChordCard.svelte'
	import DialogChordModifier from './DialogChordModifier.svelte'
	import PanelHeader from './PanelHeader.svelte'

	type ProjectEditorContextT = {
		gridChords: ChordT[]
	}

	type ChordEntryT = {
		chord: ChordT
		kind: 'lead' | 'variation'
		numeral: string
		isInProgression: boolean
	}

	type ChordLaneT = {
		rootPitch: number
		label: string
		entries: ChordEntryT[]
	}

	const context = Svelte.getContext<ProjectEditorContextT>('projectEditor')
	const gridChords = $derived(context.gridChords)
	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)
	const keyLabel = $derived(`${project.key} ${project.scale}`)
	const gridLabel = $derived(`Chords in ${keyLabel}`)

	// One dialog serves every card. It stays mounted, so a right-click
	// only flips it open instead of building it first.
	let isModifierDialogOpen = $state(false)
	let modifierChordId: string | null = $state(null)
	let keyboardChordId: string | null = $state(null)

	const modifierChord = $derived.by(() => {
		const chosenChord = gridChords.find((chord) => chord.id === modifierChordId)
		return chosenChord ?? gridChords[0]
	})

	const handleOpenModifier = (chord: ChordT) => {
		keyboard.releaseAllKeys()
		modifierChordId = chord.id
		isModifierDialogOpen = true
	}

	const handleModifierClose = () => {
		isModifierDialogOpen = false
	}

	const handleModifierSave = (args: { octaveOffset: number; inversion: number; voicing: VoicingT | null }) => {
		if (!modifierChord) return
		projectEditor.updateGridChordModifiers({
			chordId: modifierChord.id,
			octaveOffset: args.octaveOffset,
			inversion: args.inversion,
			voicing: args.voicing
		})
	}

	// Symbols already placed in the progression, so the grid
	// can mark the chords the song uses.
	const progressionSymbols = $derived.by(() => {
		const symbols = new Set<string>()
		for (const item of project.progressionChords) {
			const isChord = item.type === 'chord'
			if (!isChord) continue
			symbols.add(item.symbol)
		}
		return symbols
	})

	// The plain triad leads its lane. Scales whose degree
	// has no triad fall back to the first chord offered.
	const getLeadChord = (chords: ChordT[]): ChordT => {
		const triadChord = chords.find((chord) => checkIsTriad(chord.symbol))
		return triadChord ?? chords[0]
	}

	const groupChordsByRoot = (chords: ChordT[]): Map<number, ChordT[]> => {
		const chordsByRoot = new Map<number, ChordT[]>()

		for (const chord of chords) {
			const rootPitch = getChordRootPitch(chord.symbol)
			const existingChords = chordsByRoot.get(rootPitch)
			if (existingChords) {
				existingChords.push(chord)
				continue
			}
			chordsByRoot.set(rootPitch, [chord])
		}

		return chordsByRoot
	}

	const buildEntry = (chord: ChordT, kind: ChordEntryT['kind'], numeral: string): ChordEntryT => {
		const isInProgression = progressionSymbols.has(chord.symbol)
		return { chord, kind, numeral, isInProgression }
	}

	// The lead chord comes first, then its variations.
	const buildLane = (rootPitch: number, chords: ChordT[]): ChordLaneT => {
		const leadChord = getLeadChord(chords)
		const variationChords = chords.filter((chord) => chord.id !== leadChord.id)
		const degreeIndex = getScaleDegreeIndex({ key: project.key, scale: project.scale, rootPitch })
		const numeral = getRomanNumeral({ degreeIndex, symbol: leadChord.symbol })
		const leadEntry = buildEntry(leadChord, 'lead', numeral)
		const variationEntries = variationChords.map((chord) => buildEntry(chord, 'variation', numeral))
		const label = `${numeral} chords`
		return { rootPitch, label, entries: [leadEntry, ...variationEntries] }
	}

	// One lane per note of the scale, in scale order.
	const chordLanes = $derived.by(() => {
		const chordsByRoot = groupChordsByRoot(gridChords)
		const lanes: ChordLaneT[] = []

		for (const rootEntry of chordsByRoot) {
			const rootPitch = rootEntry[0]
			const chords = rootEntry[1]
			const lane = buildLane(rootPitch, chords)
			lanes.push(lane)
		}

		return lanes
	})

	const keyboard = ChordGridKeyboard.createChordGridKeyboard({
		getChord: (position) => {
			const lane = chordLanes[position.columnIndex]
			return lane?.entries[position.rowIndex]?.chord
		},
		startPreview: (chord) => {
			keyboardChordId = chord.id
			playbackStore.previewChord(chord, project)
		},
		stopPreview: () => {
			keyboardChordId = null
			playbackStore.stopChordPreview()
		}
	})

	const checkIsShortcutBlockedElement = (target: EventTarget): boolean => {
		const isElement = target instanceof HTMLElement
		if (!isElement) return false
		const isDialogOrSelect = target.matches('z-dialog, z-alert-dialog, z-select, select, [role="combobox"], [role="slider"], [role="spinbutton"]')
		return target.isContentEditable || isDialogOrSelect
	}

	const handleChordKeyDown = (event: KeyboardEvent) => {
		const hasModifier = event.ctrlKey || event.metaKey || event.altKey
		const shouldIgnoreKey = event.defaultPrevented || event.repeat || event.isComposing || hasModifier || isModifierDialogOpen
		if (shouldIgnoreKey) return
		const isTyping = Typing.isTypingInTextField(event)
		if (isTyping) return
		const eventPath = event.composedPath()
		const isBlocked = eventPath.some(checkIsShortcutBlockedElement)
		if (isBlocked) return
		const wasHandled = keyboard.pressKey(event.code)
		if (wasHandled) event.preventDefault()
	}

	const handleChordKeyUp = (event: KeyboardEvent) => {
		const wasHandled = keyboard.releaseKey(event.code)
		if (wasHandled) event.preventDefault()
	}

	const handleVisibilityChange = () => {
		const isHidden = document.hidden
		if (isHidden) keyboard.releaseAllKeys()
	}

	Svelte.onDestroy(keyboard.releaseAllKeys)

	// The legend only explains the dot when a dot is showing.
	const hasChordsInProgression = $derived.by(() => {
		const usedGridChord = gridChords.find((chord) => progressionSymbols.has(chord.symbol))
		return Boolean(usedGridChord)
	})
</script>

<svelte:window onkeydown={handleChordKeyDown} onkeyup={handleChordKeyUp} onblur={keyboard.releaseAllKeys} />
<svelte:document onvisibilitychange={handleVisibilityChange} />

<section class="chord-grid" aria-label={gridLabel}>
	<PanelHeader label="Chords" detail={keyLabel}>
		<z-row gap="lg" alignsY="center" class="chord-grid-help">
			{#if hasChordsInProgression}
				<z-row gap="xs" alignsY="center" class="chord-grid-legend">
					<span class="chord-grid-legend-dot" aria-hidden="true"></span>
					<z-text size="xs" color="muted">In progression</z-text>
				</z-row>
			{/if}

			<z-text size="xs" color="muted" class="chord-grid-hint">1–7 / Q–U / A–J / Z–M to listen · + to add · Right-click to shape</z-text>
		</z-row>
	</PanelHeader>

	<z-scroll class="chord-grid-scroll" direction="both" scrollbar="thin" inset="md">
		<div class="chord-grid-lanes">
			{#each chordLanes as lane (lane.rootPitch)}
				<div class="chord-grid-lane" role="list" aria-label={lane.label}>
					{#each lane.entries as entry (entry.chord.id)}
						<div role="listitem">
							<ChordCard
								chord={entry.chord}
								kind={entry.kind}
								numeral={entry.numeral}
								isInProgression={entry.isInProgression}
								{keyboardChordId}
								onOpenModifier={handleOpenModifier}
							/>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</z-scroll>

	{#if modifierChord}
		<DialogChordModifier
			isOpen={isModifierDialogOpen}
			chord={modifierChord as ProgressionChordT}
			projectOctave={project.octave}
			projectVoicing={project.voicing}
			onClose={handleModifierClose}
			onSave={handleModifierSave}
		/>
	{/if}
</section>

<style>
	/* A rounded segment of the page, like the pattern editor. */
	.chord-grid {
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

	.chord-grid-help {
		min-width: 0;
	}

	.chord-grid-legend {
		flex-shrink: 0;
	}

	.chord-grid-legend-dot {
		width: calc(var(--spacing-1) * 1.5);
		height: calc(var(--spacing-1) * 1.5);
		border-radius: 50%;
		background: var(--muted-foreground);
	}

	.chord-grid-hint {
		white-space: nowrap;
	}

	/* Pointer shortcuts mean nothing on touch, and the
	   hint will not fit on a narrow header. */
	@media (max-width: 64rem), (hover: none) {
		.chord-grid-hint {
			display: none;
		}
	}

	.chord-grid-scroll {
		flex: 1 1 0;
		min-height: 0;
		width: 100%;
	}

	/* One row of lanes, I to vii, so the scale always reads
	   left to right. Narrow screens scroll it sideways. */
	.chord-grid-lanes {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(9rem, 1fr);
		gap: var(--spacing-3);
		align-items: start;
		min-width: min-content;
	}

	.chord-grid-lane {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.chord-grid-lane > :first-child {
		margin-bottom: var(--spacing-2);
	}
</style>
