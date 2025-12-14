<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import { chordModifierStore } from '$lib/stores/chordModifier.svelte'

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
	<div class="chordSymbol">{props.chord.symbol}</div>

	<div class="actions">
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 cursor-pointer rounded-full transition-colors"
			onclick={addChordToProgression}
			title="Add to progression"
		>
			<Icon icon="mingcute:add-line" class="size-4" />
		</Button>
	</div>
</div>

<style>
	.chordCard {
		position: relative;
		height: 96px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: var(--chord-bg);
		color: var(--chord-fg);
		border: var(--border-thick);
		border-radius: 0px;
		box-shadow: var(--shadow-hard);
		cursor: pointer;
		user-select: none;
		transition: all 0.1s ease-in-out;
		overflow: visible;
		font-family: var(--font-sans);
	}

	.chordCard:hover {
		transform: translate(-2px, -2px) rotate(1deg);
		box-shadow: var(--shadow-hard-hover);
		z-index: 10;
		border-color: var(--color-ink);
	}

	.chordCard:active {
		transform: translate(4px, 4px);
		box-shadow: var(--shadow-hard-active);
	}

	.chordSymbol {
		font-family: var(--font-display);
		font-size: 24px;
		font-weight: 400;
		letter-spacing: normal;
		z-index: 1;
		color: var(--foreground);
	}

	.actions {
		position: absolute;
		top: 6px;
		right: 6px;
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
