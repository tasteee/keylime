<script lang="ts">
	import { Copy, Trash } from 'phosphor-svelte'
	import { toFractionString } from '$lib/helpers/numbers'
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

	const durationBars = $derived(selectedItem ? selectedItem.durationBeats / BEATS_PER_BAR : 0)
	const durationLabel = $derived(`${toFractionString(durationBars)} ${durationBars === 1 ? 'bar' : 'bars'}`)

	const handleDelete = () => {
		if (!selectedItem) return
		context.removeProgressionItem(selectedItem.id)
	}

	const handleDuplicate = () => {
		if (!selectedItem) return
		context.duplicateProgressionItem(selectedItem.id)
	}
</script>

{#if selectedItem}
	<div class="selectionControls">
		<z-toolbar size="sm" aria-label="Selected item">
			<z-text size="xs" weight={600} class="durationLabel">{durationLabel}</z-text>

			<z-separator isVertical></z-separator>

			<z-toolbar-group label="Item">
				<z-button kind="ghost" size="sm" onclick={handleDuplicate} aria-label="Duplicate">
					<Copy size={16} />
				</z-button>
				<z-button kind="ghost" tone="danger" size="sm" onclick={handleDelete} aria-label="Delete">
					<Trash size={16} />
				</z-button>
			</z-toolbar-group>
		</z-toolbar>
	</div>
{/if}

<style>
	/* The same floating surface as the other progression controls. */
	.selectionControls {
		margin-left: auto;
		box-sizing: border-box;
		min-height: var(--progression-controls-height);
		display: flex;
		align-items: center;
		padding: var(--spacing-2);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}

	.durationLabel {
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
</style>
