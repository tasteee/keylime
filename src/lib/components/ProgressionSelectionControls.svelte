<script lang="ts">
	import { progressionStore } from '$lib/stores/progression.svelte'
	import Icon from '@iconify/svelte'
	import { Button } from '$lib/components/ui/button'
	import { toFractionString } from '$lib/helpers/numbers'
	import HerDivider from './HerDivider.svelte'
	import HerButton from './HerButton.svelte'

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
		const newDuration = Math.max(MIN_DURATION_BEATS, selectedItem.durationBeats + delta)
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
		<p class="herPanelTitleSmall">{selectedTypeText}</p>

		<div class="controls-group">
			<span class="text-xs font-medium text-foreground/80 whitespace-nowrap">
				{toFractionString(selectedItem.durationBeats / BEATS_PER_BAR)}
				{selectedItem.durationBeats / BEATS_PER_BAR === 1 ? 'BAR' : 'BARS'}
			</span>

			<HerDivider />

			<HerButton
				kind="ghost"
				size="large"
				onclick={() => adjustDuration(-1)}
				title="Decrease duration"
				label=""
				leftIcon="mingcute:minimize-line"
			/>

			<HerButton
				kind="ghost"
				size="large"
				onclick={() => adjustDuration(1)}
				title="Increase duration"
				label=""
				leftIcon="mingcute:add-line"
			/>

			<HerDivider />

			<HerButton
				kind="ghost"
				size="large"
				onclick={() => moveItem(-1)}
				title="Move Left"
				leftIcon="mingcute:arrow-left-line"
				label=""
			/>

			<HerButton
				kind="ghost"
				size="large"
				onclick={() => moveItem(1)}
				title="Move Right"
				leftIcon="mingcute:arrow-right-line"
				label=""
			/>

			<HerDivider />

			<HerButton
				kind="ghost"
				size="large"
				onclick={handleDuplicate}
				title="Duplicate"
				leftIcon="mingcute:copy-2-fill"
				label=""
			/>
			<HerButton
				kind="ghost"
				size="large"
				onclick={handleDelete}
				title="Delete"
				rightIcon="mingcute:delete-2-fill"
				label=""
			/>
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
	}
</style>
