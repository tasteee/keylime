<script lang="ts">
	import { getContext } from 'svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import ChordCard from './ChordCard.svelte'
	import DialogChordModifier from './DialogChordModifier.svelte'
	import PanelHeader from './PanelHeader.svelte'

	type ProjectEditorContextT = {
		gridChords: ChordT[]
	}

	type ChordColumnT = {
		root: string
		chords: ChordT[]
	}

	const context = getContext<ProjectEditorContextT>('projectEditor')
	const gridChords = $derived(context.gridChords)
	const projectEditor = useProjectEditor()

	// One dialog serves every card. It stays mounted, so a right-click
	// only flips it open instead of building it first.
	let isModifierDialogOpen = $state(false)
	let modifierChordId: string | null = $state(null)

	const modifierChord = $derived.by(() => {
		const chosenChord = gridChords.find((chord) => chord.id === modifierChordId)
		return chosenChord ?? gridChords[0]
	})

	const handleOpenModifier = (chord: ChordT) => {
		modifierChordId = chord.id
		isModifierDialogOpen = true
	}

	const handleModifierClose = () => {
		isModifierDialogOpen = false
	}

	const handleModifierSave = (args: { octaveOffset: number; inversion: number; voicing: VoicingT }) => {
		if (!modifierChord) return
		projectEditor.updateGridChordModifiers({
			chordId: modifierChord.id,
			octaveOffset: args.octaveOffset,
			inversion: args.inversion,
			voicing: args.voicing
		})
	}

	const getRootName = (chord: ChordT): string => {
		const rootMatch = chord.symbol.match(/^[A-G][#b]?/)
		if (!rootMatch) return chord.symbol
		return rootMatch[0]
	}

	// One column per note of the scale, in scale order.
	// Each column holds the chords built on that note.
	const chordColumns = $derived.by(() => {
		const columnsByRoot = new Map<string, ChordColumnT>()

		for (const chord of gridChords) {
			const root = getRootName(chord)
			const existingColumn = columnsByRoot.get(root)
			if (existingColumn) {
				existingColumn.chords.push(chord)
				continue
			}
			columnsByRoot.set(root, { root, chords: [chord] })
		}

		return [...columnsByRoot.values()]
	})
</script>

<div class="chordGrid">
	<PanelHeader label="Chords" />

	<z-scroll class="chordCardScroll" direction="both" inset="md">
		<z-row gap="sm" class="chordColumns">
			{#each chordColumns as column (column.root)}
				<z-column gap="sm" class="chordColumn">
					{#each column.chords as chord (chord.id)}
						<ChordCard {chord} onOpenModifier={handleOpenModifier} />
					{/each}
				</z-column>
			{/each}
		</z-row>
	</z-scroll>

	{#if modifierChord}
		<DialogChordModifier
			isOpen={isModifierDialogOpen}
			chord={modifierChord as ProgressionChordT}
			projectOctave={projectEditor.state.project.octave}
			onClose={handleModifierClose}
			onSave={handleModifierSave}
		/>
	{/if}
</div>

<style>
	/* A rounded segment of the page, like the pattern editor. */
	.chordGrid {
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

	.chordCardScroll {
		flex: 1 1 0;
		min-height: 0;
		width: 100%;
	}

	.chordColumns {
		min-width: min-content;
	}

	.chordColumn {
		flex: 1 1 7rem;
		min-width: 7rem;
	}
</style>
