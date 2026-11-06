<script lang="ts">
	import { Plus } from 'phosphor-svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import playbackStore from '$lib/stores/playback.svelte'
	import { chordModifierStore } from '$lib/stores/chordModifier.svelte'
	import ChordSymbolDisplay from './ChordSymbolDisplay.svelte'

	type ChordCardPropsT = {
		chord: ChordT
	}

	const props: ChordCardPropsT = $props()
	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)
	const isPlaying = $derived(playbackStore.currentlyPlayingChordId === props.chord.id)

	const contextMenuItems = [
		{ value: 'add', label: 'Add to progression' },
		{ value: 'modify', label: 'Modify chord…' }
	]

	const openChordModifier = () => {
		chordModifierStore.openForGridChord({ chordId: props.chord.id })
	}

	const addChordToProgression = () => {
		const chordToAdd: ChordT = {
			...props.chord,
			id: crypto.randomUUID()
		}

		projectEditor.addProgressionChord(chordToAdd)
	}

	const handleContextMenuSelect = (event: CustomEvent) => {
		const selectedValue: string = event.detail.value
		if (selectedValue === 'add') addChordToProgression()
		if (selectedValue === 'modify') openChordModifier()
	}

	const handleAddButtonClick = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		addChordToProgression()
	}

	const handleMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		const isButtonTarget = target.closest('z-button')
		if (isButtonTarget) return

		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		event.preventDefault()
		event.stopPropagation()
		playbackStore.playChord(props.chord, project.octave)
	}
</script>

<z-context-menu items={contextMenuItems} onselect={handleContextMenuSelect}>
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
	>
		<z-row alignsX="between" alignsY="center" isFullHeight>
			<ChordSymbolDisplay symbol={props.chord.symbol} />

			<z-tooltip content="Add to progression" placement="top" class="chordCardAction">
				<z-button kind="ghost" size="sm" onclick={handleAddButtonClick} aria-label="Add to progression">
					<Plus size={16} weight="bold" />
				</z-button>
			</z-tooltip>
		</z-row>
	</z-surface>
</z-context-menu>

<style>
	.chordCard {
		height: 5rem;
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
