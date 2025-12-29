<script lang="ts">
	import ChordCard from './ChordCard.svelte'
	import SelectKey from './SelectKey.svelte'
	import SelectScale from './SelectScale.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import Divider from '../ui/divider.svelte'
	import Icon from '@iconify/svelte'
	import { getContext } from 'svelte'

	type ProjectEditorContextT = {
		state: {
			project: ProjectT
			isLoading: boolean
			isSaving: boolean
			isDirty: boolean
			cleanProjectSnapshot: string
			activeView: 'chords' | 'pattern'
			selectedProgressionItemId: string | null
		}
		gridChords: ChordT[]
		updateProject: (updates: Partial<ProjectT>) => void
		updateProgressionItem: (updatedItem: Partial<ProgressionItemT>) => void
		addProgressionChord: (chord: ChordT) => void
		addProgressionRest: () => void
		removeProgressionItem: (id: string) => void
		duplicateProgressionItem: (id: string) => void
		reorderProgressionItem: (args: { itemId: string; newIndex: number }) => void
		selectProgressionItem: (id: string | null) => void
		addPatternSignal: (signal: SignalT) => void
		updatePatternSignal: (signalId: string, updates: Partial<SignalT>) => void
		removePatternSignal: (signalId: string) => void
		movePatternSignalToRow: (args: MoveSignalToRowOptionsT) => void
		save: () => Promise<{ didSucceed: boolean }>
		saveClone: () => Promise<{ didSucceed: boolean; newProjectId: string }>
		checkIsDirty: () => boolean
	}

	const context = getContext<ProjectEditorContextT>('projectEditor')
	const gridChords = $derived(context.gridChords)

	const keyScaleText = $derived.by(() => {
		const key = context.state.project.key || ''
		const scale = context.state.project.scale || ''
		return `${key} ${scale}`
	})
</script>

<section class="ChordCardGrid">
	<div class="chordToolbar">
		<Box gap="16px" align="center" minWidth="100px">
			<Icon icon="mingcute:grid-fill" width="20px" height="20px" />

			<div class="titleSection">
				<span class="herPanelTitle">Chords</span>
				<span class="keyScaleText text-xs font-medium text-foreground/80 whitespace-nowrap uppercase">
					{keyScaleText}
				</span>
			</div>
		</Box>

		<Divider margin="24px" />

		<Box gap="8px" align="center">
			<SelectKey />
			<SelectScale />
		</Box>

		<Divider margin="24px" />
	</div>

	<div class="containerrr">
		{#each gridChords as chord}
			<ChordCard {chord} />
		{/each}
	</div>
</section>

<style>
	.ChordCardGrid {
		width: 100%;
		min-height: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.chordToolbar {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0px 24px;
		height: 54px;
		background-color: var(--color-panel-bg);
		border-bottom: 1px solid var(--n-03);
		/* border-top: 1px solid var(--n-03); */
	}

	.titleSection {
		display: flex;
		flex-direction: column;
	}

	.keyScaleText {
		position: relative;
		top: -5px;
	}

	.containerrr {
		align-content: start;
		/* border-radius: 5px; */
		display: grid;
		flex: 1;
		grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
		overflow: hidden;
		overflow-y: auto;
		width: 100%;
		border-right: none;
		border-bottom: none;
		padding: 12px;
		background: var(--n-02);
	}
</style>
