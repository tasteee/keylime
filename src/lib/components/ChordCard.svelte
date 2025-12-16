<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import { chordModifierStore } from '$lib/stores/chordModifier.svelte'
	import ChordSymbolDisplay from './ChordSymbolDisplay.svelte'

	type ChordCardPropsT = {
		chord: ChordT
	}

	const props: ChordCardPropsT = $props()

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

		progressionStore.addChord(chordToAdd)
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
	onmousedown={onMouseDown}
	onmouseup={onMouseUp}
	onmouseleave={onMouseLeave}
	oncontextmenu={handleContextMenu}
	role="button"
	tabindex={0}
>
	<ChordSymbolDisplay symbol={props.chord.symbol} />

	<div class="actions">
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 cursor-pointer transition-colors"
			style="border-radius: 6px;"
			onclick={addChordToProgression}
			title="Add to progression"
		>
			<Icon icon="mingcute:add-line" class="size-4" />
		</Button>
	</div>
</div>

<style>
	.chordCard {
		cursor: pointer;
		display: flex;
		flex-direction: column;
		height: 80px;
		justify-content: center;
		overflow: visible;
		padding: 12px 24px;
		position: relative;
		transition: all 0.1s ease-in-out;
		user-select: none;
		z-index: 10;
		outline: 2px solid #747474;
		outline-offset: -1px;
	}

	.chordCard:last-child {
		border-bottom-right-radius: 8px;
	}

	.chordCard:hover {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		background-color: #efefef;
		/* border: 3px solid #747474; */
	}

	.actions {
		position: absolute;
		top: 32px;
		right: 16px;
		opacity: 0;
		transform: translateY(-4px);
		transition: all 0.2s ease;
		z-index: 10;
	}

	.chordCard:hover .actions,
	.actions:hover {
		opacity: 1;
		transform: translateY(0);
	}
</style>
