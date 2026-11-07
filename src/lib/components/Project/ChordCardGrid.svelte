<script lang="ts">
	import { getContext } from 'svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import ChordCard from './ChordCard.svelte'
	import DialogChordModifier from './DialogChordModifier.svelte'
	import PanelHeader from './PanelHeader.svelte'
	import './chordCardGrid.css'

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
	const project = $derived(projectEditor.state.project)
	const gridTitle = $derived(`Chords in ${project.key} ${project.scale.toLowerCase()}`)
	const isEmpty = $derived(gridChords.length === 0)

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

<section class="chordCardGrid" aria-label={gridTitle}>
	<PanelHeader label={gridTitle} />

	<div class="chordCardScroll">
		<div class="chordColumns">
			{#each chordColumns as column (column.root)}
				<div class="chordColumn">
					{#each column.chords as chord (chord.id)}
						<ChordCard {chord} onOpenModifier={handleOpenModifier} />
					{/each}
				</div>
			{/each}
		</div>
		{#if isEmpty}
			<z-text color="muted">No chords in this scale.</z-text>
		{/if}
	</div>

	{#if modifierChord}
		<DialogChordModifier
			isOpen={isModifierDialogOpen}
			chord={modifierChord as ProgressionChordT}
			projectOctave={projectEditor.state.project.octave}
			onClose={handleModifierClose}
			onSave={handleModifierSave}
		/>
	{/if}
</section>
