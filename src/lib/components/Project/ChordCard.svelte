<script lang="ts">
	import { Plus, SlidersHorizontal, SpeakerSimpleHigh } from 'phosphor-svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import playbackStore from '$lib/stores/playback.svelte'
	import { getChordColor } from '$lib/helpers/chordColors'
	import { getChordNoteNames, checkIsChordShaped, getChordShapeSummary } from '$lib/helpers/chordGridLabels'
	import ChordSymbolDisplay from './ChordSymbolDisplay.svelte'

	type ChordCardPropsT = {
		chord: ChordT
		// 'lead' is the main chord of a scale degree.
		// 'variation' is a quieter row beneath it.
		kind: 'lead' | 'variation'
		numeral?: string
		isInProgression: boolean
		// The grid owns one shared modifier dialog, so opening is instant.
		onOpenModifier: (chord: ChordT) => void
	}

	const props: ChordCardPropsT = $props()
	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)

	let isAuditioning = $state(false)

	const isLead = $derived(props.kind === 'lead')
	const isVariation = $derived(props.kind === 'variation')
	const isPlaybackChord = $derived(playbackStore.currentlyPlayingChordId === props.chord.id)
	const isSounding = $derived(isPlaybackChord || isAuditioning)
	const isShaped = $derived(checkIsChordShaped(props.chord))
	const chordColor = $derived(getChordColor({ symbol: props.chord.symbol }))
	const noteNames = $derived(getChordNoteNames(props.chord, project.octave, project.voicing))
	const shapeSummary = $derived(getChordShapeSummary(props.chord))
	const symbolSize = $derived(isLead ? 'lg' : 'sm')
	const hasNumeral = $derived(isLead && Boolean(props.numeral))
	const shapeTooltip = $derived(isShaped ? `Shape: ${shapeSummary}` : 'Shape voicing, inversion and octave')
	const progressionNote = $derived(props.isInProgression ? ' In your progression.' : '')
	const shapeNote = $derived(isShaped ? ` Shaped: ${shapeSummary}.` : '')
	const auditionLabel = $derived(`${props.chord.symbol}.${shapeNote}${progressionNote} Hold to listen.`)
	const notesLabel = $derived(`Notes ${noteNames.join(', ')}`)
	const addLabel = $derived(`Add ${props.chord.symbol} to progression`)

	const addChordToProgression = () => {
		const chordToAdd: ChordT = {
			...props.chord,
			id: crypto.randomUUID()
		}

		projectEditor.addProgressionChord(chordToAdd)
	}

	const startAudition = () => {
		isAuditioning = true
		playbackStore.previewChord(props.chord, project)
	}

	const stopAudition = () => {
		isAuditioning = false
		playbackStore.stopChordPreview()
	}

	// Right-click opens the chord modifier directly.
	const handleContextMenu = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		props.onOpenModifier(props.chord)
	}

	const handleAddClick = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		addChordToProgression()
	}

	const handleShapeClick = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		props.onOpenModifier(props.chord)
	}

	const handleMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		// Clicks on the action buttons or inside the modifier dialog are not previews.
		const isButtonTarget = target.closest('z-button')
		if (isButtonTarget) return
		const isDialogTarget = target.closest('z-dialog')
		if (isDialogTarget) return

		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		event.preventDefault()
		event.stopPropagation()
		startAudition()
		window.addEventListener('mouseup', stopAudition, { once: true })
	}

	const checkIsAuditionKey = (event: KeyboardEvent): boolean => {
		const isEnterKey = event.key === 'Enter'
		const isSpaceKey = event.code === 'Space'
		return isEnterKey || isSpaceKey
	}

	// Enter or Space plays the chord while held. The page
	// uses Space for transport, so the event stops here.
	const handleAuditionKeyDown = (event: KeyboardEvent) => {
		const isAuditionKey = checkIsAuditionKey(event)
		if (!isAuditionKey) return
		event.preventDefault()
		event.stopPropagation()
		if (event.repeat) return
		startAudition()
	}

	const handleAuditionKeyUp = (event: KeyboardEvent) => {
		const isAuditionKey = checkIsAuditionKey(event)
		if (!isAuditionKey) return
		event.preventDefault()
		event.stopPropagation()
		stopAudition()
	}
</script>

<!-- Pointer shortcuts only. The audition button and the
     action buttons give keyboard users the same actions. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="chord-card"
	class:isLead
	class:isVariation
	class:isSounding
	class:isShaped
	data-chord-color={chordColor}
	role="group"
	aria-label={props.chord.symbol}
	onmousedown={handleMouseDown}
	oncontextmenu={handleContextMenu}
>
	<button
		type="button"
		class="chord-card-audition"
		aria-label={auditionLabel}
		onkeydown={handleAuditionKeyDown}
		onkeyup={handleAuditionKeyUp}
		onblur={stopAudition}
	>
		{#if hasNumeral}
			<span class="chord-card-numeral">{props.numeral}</span>
		{/if}

		<span class="chord-card-name">
			<ChordSymbolDisplay symbol={props.chord.symbol} size={symbolSize} />

			{#if isShaped}
				<span class="chord-card-shaped" aria-hidden="true">
					<SlidersHorizontal size={12} weight="bold" />
				</span>
			{/if}

			{#if props.isInProgression}
				<span class="chord-card-used" aria-hidden="true"></span>
			{/if}

			{#if isSounding}
				<span class="chord-card-sounding" aria-hidden="true">
					<SpeakerSimpleHigh size={14} weight="fill" />
				</span>
			{/if}
		</span>

		<span class="chord-card-notes" aria-label={notesLabel}>
			{#each noteNames as noteName (noteName)}
				<span class="chord-card-note">{noteName}</span>
			{/each}
		</span>
	</button>

	<div class="chord-card-actions">
		<z-tooltip content={shapeTooltip} placement="top" class="chord-card-shape">
			<z-button kind="ghost" size="sm" onclick={handleShapeClick} aria-label={shapeTooltip}>
				<SlidersHorizontal size={16} />
			</z-button>
		</z-tooltip>

		<z-tooltip content="Add to progression" placement="top" class="chord-card-add">
			<z-button kind="ghost" size="sm" onclick={handleAddClick} aria-label={addLabel}>
				<Plus size={16} weight="bold" />
			</z-button>
		</z-tooltip>
	</div>
</div>

<style>
	/* One chord. The audition area fills the card so a press
	   anywhere plays it; the actions float in the top corner. */
	.chord-card {
		position: relative;
		display: flex;
		align-items: flex-start;
		min-width: 0;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		user-select: none;
		cursor: pointer;
		transition:
			background var(--motion-fast) var(--ease-enter),
			border-color var(--motion-fast) var(--ease-enter);
	}

	.chord-card.isLead {
		background: var(--chord-bg, var(--color-neutral-1));
		border-color: var(--chord-border, var(--border));
	}

	.chord-card.isLead:hover {
		background: var(--chord-bg-hover, var(--color-neutral-2));
		border-color: var(--chord-border-hover, var(--border));
	}

	.chord-card.isVariation:hover {
		background: var(--chord-bg, var(--color-neutral-1));
	}

	.chord-card.isSounding,
	.chord-card.isSounding:hover {
		background: var(--chord-bg-strong, var(--color-neutral-2));
		border-color: var(--chord-border-hover, var(--border));
	}

	.chord-card:has(.chord-card-audition:focus-visible) {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}

	.chord-card-audition {
		all: unset;
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		padding: calc(var(--spacing-1) * 1.5) var(--spacing-3);
		cursor: pointer;
	}

	.chord-card.isLead .chord-card-audition {
		gap: var(--spacing-1);
		padding: var(--spacing-3);
	}

	.chord-card-numeral {
		font-size: var(--font-size-caption);
		font-weight: var(--font-weight-semibold);
		line-height: var(--line-height-caption);
		color: var(--muted-foreground);
	}

	.chord-card-name {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
		overflow: hidden;
	}

	.chord-card-name :global(.chordSymbol) {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chord-card-shaped {
		display: inline-flex;
		flex-shrink: 0;
		color: var(--chord-root, var(--foreground));
	}

	.chord-card-sounding {
		display: inline-flex;
		color: var(--chord-root, var(--foreground));
	}

	.chord-card-notes {
		display: flex;
		gap: var(--spacing-2);
		overflow: hidden;
		white-space: nowrap;
		font-size: var(--font-size-caption);
		line-height: var(--line-height-caption);
		color: var(--muted-foreground);
	}

	/* Floats over the card so hidden buttons take no room
	   from the chord name. */
	.chord-card-actions {
		position: absolute;
		top: var(--spacing-1);
		right: var(--spacing-1);
		display: flex;
		align-items: center;
	}

	.chord-card-used {
		flex-shrink: 0;
		width: calc(var(--spacing-1) * 1.5);
		height: calc(var(--spacing-1) * 1.5);
		border-radius: 50%;
		background: var(--chord-root, var(--foreground));
	}

	/* Actions stay quiet until the card is in play. */
	.chord-card :global(.chord-card-shape),
	.chord-card :global(.chord-card-add) {
		opacity: 0;
		transition: opacity var(--motion-fast) var(--ease-enter);
	}

	.chord-card:hover :global(.chord-card-shape),
	.chord-card:hover :global(.chord-card-add),
	.chord-card:focus-within :global(.chord-card-shape),
	.chord-card:focus-within :global(.chord-card-add) {
		opacity: 1;
	}

	/* Touch screens have no hover, so actions always show. */
	@media (hover: none) {
		.chord-card :global(.chord-card-shape),
		.chord-card :global(.chord-card-add) {
			opacity: 1;
		}
	}
</style>
