<script lang="ts">
	import { progressionStore } from '$lib/stores/progression.svelte'
	import Icon from '@iconify/svelte'
	import { Button } from '$lib/components/ui/button'
	import { toFractionString } from '$lib/helpers/numbers'
	import SheDivider from '$lib/components/sha/ShaDivider.svelte'

	const BEATS_PER_BAR = 4
	const MIN_DURATION_BEATS = 1

	const selectedItem = $derived.by(() => {
		if (!progressionStore.selectedItemId) return null
		return progressionStore.getItem(progressionStore.selectedItemId)
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
		progressionStore.updateItem({
			id: selectedItem.id,
			durationBeats: newDuration
		})
	}

	const moveItem = (direction: number) => {
		if (!selectedItem) return
		const currentIndex = progressionStore.items.findIndex((i) => i.id === selectedItem.id)
		if (currentIndex === -1) return

		const newIndex = currentIndex + direction
		if (newIndex < 0 || newIndex >= progressionStore.items.length) return

		progressionStore.reorderItem({
			itemId: selectedItem.id,
			newIndex
		})
	}

	const handleDelete = () => {
		progressionStore.deleteSelectedItem()
	}

	const handleDuplicate = () => {
		progressionStore.duplicateSelectedItem()
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
