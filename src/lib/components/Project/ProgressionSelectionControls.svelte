<script lang="ts">
	import Icon from '@iconify/svelte'
	import { Button } from '$lib/components/ui/button'
	import { toFractionString } from '$lib/helpers/numbers'
	import SheDivider from '$lib/components/ui/divider.svelte'
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

	const BEATS_PER_BAR = 4
	const MIN_DURATION_BEATS = 1

	// Derive progressionItems with calculated startTime
	const progressionItems = $derived.by(() => {
		let accumulatedStartTime = 0
		return context.state.project.progressionChords.map((item) => {
			const startTime = accumulatedStartTime
			accumulatedStartTime += item.durationBeats
			return { ...item, startTime } as ProgressionItemT
		})
	})

	const selectedItem = $derived.by(() => {
		const selectedProgressionItemId = context.state.selectedProgressionItemId
		if (!selectedProgressionItemId) return null
		const found = progressionItems.find((item) => item.id === selectedProgressionItemId)
		return found ?? null
	})

	const selectedTypeText = $derived.by(() => {
		if (!selectedItem) return ''
		if (selectedItem.type === 'rest') return 'Rest'
		if (selectedItem.type === 'chord') return 'Chord'
		return ''
	})

	const adjustDuration = (delta: number) => {
		if (!selectedItem) return
		const newDuration = Math.max(MIN_DURATION_BEATS, selectedItem.durationBeats + delta * 0.5)
		context.updateProgressionItem({
			id: selectedItem.id,
			durationBeats: newDuration
		})
	}

	const moveItem = (direction: number) => {
		if (!selectedItem) return
		const currentIndex = progressionItems.findIndex((i) => i.id === selectedItem.id)
		if (currentIndex === -1) return

		const newIndex = currentIndex + direction
		if (newIndex < 0 || newIndex >= progressionItems.length) return

		context.reorderProgressionItem({
			itemId: selectedItem.id,
			newIndex
		})
	}

	const handleDelete = () => {
		if (!selectedItem) return
		context.removeProgressionItem(selectedItem.id)
	}

	const handleDuplicate = () => {
		if (!selectedItem) return
		context.duplicateProgressionItem(selectedItem.id)
	}
</script>

<div class="selectionControls">
	{#if selectedItem}
		<!-- <p class="herPanelTitleSmall">{selectedTypeText}</p> -->

		<div class="controls-group">
			<span class="text-xs font-medium text-foreground/80 whitespace-nowrap">
				{toFractionString(selectedItem.durationBeats / BEATS_PER_BAR)}
				{selectedItem.durationBeats / BEATS_PER_BAR === 1 ? 'BAR' : 'BARS'}
			</span>

			<SheDivider />

			<Button kind="ghost" isIcon onclick={() => adjustDuration(-1)} title="Decrease duration">
				<Icon icon="mingcute:minimize-line" class="w-5 h-5" />
			</Button>

			<Button kind="ghost" isIcon onclick={() => adjustDuration(1)} title="Increase duration">
				<Icon icon="mingcute:add-line" class="w-5 h-5" />
			</Button>

			<SheDivider />

			<Button kind="ghost" isIcon onclick={() => moveItem(-1)} title="Move Left">
				<Icon icon="mingcute:arrow-left-line" class="w-5 h-5" />
			</Button>

			<Button kind="ghost" isIcon onclick={() => moveItem(1)} title="Move Right">
				<Icon icon="mingcute:arrow-right-line" class="w-5 h-5" />
			</Button>

			<SheDivider />

			<Button kind="ghost" isIcon onclick={handleDuplicate} title="Duplicate">
				<Icon icon="mingcute:copy-2-fill" class="w-5 h-5" />
			</Button>
			<Button kind="ghost" isIcon onclick={handleDelete} title="Delete">
				<Icon icon="mingcute:delete-2-fill" class="w-5 h-5" />
			</Button>
		</div>
	{/if}
</div>

<style>
	.selectionControls {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-left: auto;
	}

	.controls-group {
		display: flex;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--n-03);
		padding: 4px 8px 4px 12px;
		border-radius: 6px;
	}
</style>
