<script lang="ts">
	import { Plus } from 'phosphor-svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import playbackStore from '$lib/stores/playback.svelte'
	import ChordSymbolDisplay from './ChordSymbolDisplay.svelte'
	import DialogChordModifier from './DialogChordModifier.svelte'

	type ChordCardPropsT = {
		chord: ChordT
	}

	const props: ChordCardPropsT = $props()
	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)
	const isPlaying = $derived(playbackStore.currentlyPlayingChordId === props.chord.id)

	let isModifierDialogOpen = $state(false)

	const addChordToProgression = () => {
		const chordToAdd: ChordT = {
			...props.chord,
			id: crypto.randomUUID()
		}

		projectEditor.addProgressionChord(chordToAdd)
	}

	// Right-click opens the chord modifier directly.
	const handleContextMenu = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		isModifierDialogOpen = true
	}

	const handleModifierClose = () => {
		isModifierDialogOpen = false
	}

	const handleModifierSave = (args: { octaveOffset: number; inversion: number; voicing: VoicingT }) => {
		projectEditor.updateGridChordModifiers({
			chordId: props.chord.id,
			octaveOffset: args.octaveOffset,
			inversion: args.inversion,
			voicing: args.voicing
		})
	}

	const handleAddButtonClick = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		addChordToProgression()
	}

	const handleMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		// Clicks on the add button or inside the modifier dialog are not previews.
		const isButtonTarget = target.closest('z-button')
		if (isButtonTarget) return
		const isDialogTarget = target.closest('z-dialog')
		if (isDialogTarget) return

		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		event.preventDefault()
		event.stopPropagation()
		playbackStore.previewChord(props.chord, project)
	}
</script>

<z-surface
	level="1"
	isBordered
	isInteractive
	isFullWidth
	radius="md"
	insetX="lg"
	class="chordCard"
	class:isPlaying
	role="button"
	tabindex="0"
	onmousedown={handleMouseDown}
	oncontextmenu={handleContextMenu}
>
	<z-row alignsX="between" alignsY="center" isFullHeight>
		<ChordSymbolDisplay symbol={props.chord.symbol} />

		<z-tooltip content="Add to progression" placement="top" class="chordCardAction">
			<z-button kind="ghost" size="sm" onclick={handleAddButtonClick} aria-label="Add to progression">
				<Plus size={16} weight="bold" />
			</z-button>
		</z-tooltip>
	</z-row>

	{#if isModifierDialogOpen}
		<DialogChordModifier
			isOpen={isModifierDialogOpen}
			chord={props.chord as ProgressionChordT}
			projectOctave={project.octave}
			onClose={handleModifierClose}
			onSave={handleModifierSave}
		/>
	{/if}
</z-surface>

<style>
	.chordCard {
		height: 3.5rem;
		user-select: none;
	}

	.chordCard.isPlaying {
		border-color: var(--purple);
	}

	.chordCard :global(.chordCardAction) {
		opacity: 0;
		transition: opacity var(--motion-fast) var(--ease-enter);
	}

	.chordCard:hover :global(.chordCardAction),
	.chordCard:focus-within :global(.chordCardAction) {
		opacity: 1;
	}
</style>
