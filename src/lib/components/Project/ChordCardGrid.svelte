<script lang="ts">
	import { SquaresFour } from 'phosphor-svelte'
	import { getContext } from 'svelte'
	import ChordCard from './ChordCard.svelte'
	import SelectKey from './SelectKey.svelte'
	import SelectScale from './SelectScale.svelte'

	type ProjectEditorContextT = {
		state: {
			project: ProjectT
		}
		gridChords: ChordT[]
	}

	const context = getContext<ProjectEditorContextT>('projectEditor')
	const gridChords = $derived(context.gridChords)

	const keyScaleText = $derived.by(() => {
		const key = context.state.project.key || ''
		const scale = context.state.project.scale || ''
		return `${key} ${scale}`
	})
</script>

<z-column class="chordCardGrid">
	<z-row insetX="lg" insetY="sm" gap="lg" alignsY="center" isFullWidth>
		<z-row gap="sm" alignsY="center">
			<SquaresFour size={20} />
			<z-column>
				<z-subheading size="md">Chords</z-subheading>
				<z-text size="xs" color="muted" class="keyScaleText">{keyScaleText}</z-text>
			</z-column>
		</z-row>

		<z-separator isVertical></z-separator>

		<z-row gap="md" alignsY="center">
			<SelectKey />
			<SelectScale />
		</z-row>
	</z-row>
	<z-separator></z-separator>

	<z-scroll class="chordCardScroll" inset="md">
		<z-grid minColumnWidth="10rem" gap="sm">
			{#each gridChords as chord (chord.id)}
				<ChordCard {chord} />
			{/each}
		</z-grid>
	</z-scroll>
</z-column>

<style>
	.chordCardGrid {
		flex: 1;
		min-height: 0;
		width: 100%;
	}

	.chordCardScroll {
		flex: 1;
		min-height: 0;
	}

	.keyScaleText {
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
</style>
