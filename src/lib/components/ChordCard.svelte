<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import projectStore from '$lib/stores/project.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import { chordModifierStore } from '$lib/stores/chordModifier.svelte'
	import ChordSymbolDisplay from './ChordSymbolDisplay.svelte'

	type ChordCardPropsT = {
		chord: ChordT
	}

	const props: ChordCardPropsT = $props()

	const isPlaying = $derived(playbackStore.currentlyPlayingChordId === props.chord.id)

	const handleContextMenu = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		chordModifierStore.openForGridChord({
			chordId: props.chord.id
		})
	}

	const addChordToProgression = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()

		// Create a new chord instance for the progression
		const chordToAdd: ChordT = {
			...props.chord,
			id: crypto.randomUUID()
		}

		projectStore.addProgressionChord(chordToAdd)
	}

	const onMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		if (target.closest('button')) return
		const isLeftButton = event.button === 0
		if (!isLeftButton) return
		event.preventDefault()
		event.stopPropagation()
		playbackStore.playChord(props.chord)
	}

	const onMouseUp = (event: MouseEvent) => {
		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		event.preventDefault()
		event.stopPropagation()

		// Stop playback handled by playChord internally
	}

	const onMouseLeave = () => {
		// Stop playback handled by playChord internally
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="chordCard"
	class:playing={isPlaying}
	onmousedown={onMouseDown}
	onmouseup={onMouseUp}
	onmouseleave={onMouseLeave}
	oncontextmenu={handleContextMenu}
	role="button"
	tabindex={0}
>
	<ChordSymbolDisplay symbol={props.chord.symbol} />

	<div class="actions">
		<Button kind="ghost" isIcon onclick={addChordToProgression} title="Add to progression">
			<Icon icon="mingcute:add-line" class="size-4" />
		</Button>
	</div>
</div>

<style>
	.chordCard {
		display: flex;
		flex-direction: column;
		height: 80px;
		justify-content: center;
		overflow: visible;
		padding: 0 24px;
		position: relative;
		/* transition: all 0.1s ease-in-out; */
		user-select: none;
		z-index: 10;
		outline: 1px solid var(--n-03);
		outline-offset: 0px;
		background: var(--n-01);
	}

	.chordCard:hover {
		background-color: var(--colorWhite);
	}

	/* .chordCard.playing {
		background-color: var(--n-03);
	} */

	.actions {
		position: absolute;
		top: 32px;
		right: 16px;
		opacity: 0;
		transform: translateY(-8px);
		transition: all 0.2s ease;
		z-index: 10;
	}

	.chordCard:hover .actions {
		opacity: 1;
		transform: translateY(-4px);
	}
</style>
