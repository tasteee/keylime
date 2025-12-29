<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { RangeInput } from '$lib/components/ui/range-input'
	import * as Select from '$lib/components/ui/select/index.js'
	import * as Popover from '$lib/components/ui/popover'
	import { ScrollArea } from '$lib/components/ui/scroll-area'
	import Badge from '$lib/components/ui/badge/badge.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import Icon from '@iconify/svelte'
	import fuzzy from 'fuzzy'
	import ALL_CHORD_NAMES from '$lib/constants/allChordNames.json'
	import chordsByScale from '$lib/constants/chordsByScale.json'
	import Divider from './ui/divider.svelte'

	type FilterOptionsT = {
		searchText: string
		key: string | null
		scale: string | null
		bpmMin: number | null
		bpmMax: number | null
		chordSymbols: string[]
		chordMatchMode: 'all' | 'any'
	}

	type ProjectsBrowserBarPropsT = {
		onsubmit: (options: FilterOptionsT) => void
	}

	const props: ProjectsBrowserBarPropsT = $props()

	const MUSICAL_KEYS = ['All', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']
	const SCALES = ['All', 'Major', 'Minor']

	const COMMON_CHORDS = ALL_CHORD_NAMES

	let searchText = $state('')
	let selectedKey = $state<string>('All')
	let selectedScale = $state<string>('All')
	let bpmMinValue = $state('')
	let bpmMaxValue = $state('')
	let chordSymbolInput = $state('')
	let selectedChordSymbols = $state<string[]>([])
	let chordMatchMode = $state<'all' | 'any'>('any')
	let isChordPickerOpen = $state(false)

	const availableChords = $derived.by(() => {
		if (selectedKey !== 'All' && selectedScale !== 'All' && selectedScale !== 'Harmonic Minor') {
			const key = `${selectedKey} ${selectedScale}`
			// @ts-ignore
			const scaleChords = chordsByScale[key]
			if (scaleChords) return scaleChords as string[]
		}
		return COMMON_CHORDS
	})

	const filteredAvailableChords = $derived.by(() => {
		if (!chordSymbolInput) return availableChords
		const results = fuzzy.filter(chordSymbolInput, availableChords)
		const matchedChords = results.map((result) => result.string)
		return matchedChords
	})

	const hasReachedMaxChords = $derived(selectedChordSymbols.length >= 4)

	const handleKeySelect = (value: string) => {
		selectedKey = value
	}

	const handleScaleSelect = (value: string) => {
		selectedScale = value
	}

	const handleAddChordSymbol = (symbol: string) => {
		const trimmedSymbol = symbol.trim()
		if (!trimmedSymbol) return

		const isAlreadyAdded = selectedChordSymbols.includes(trimmedSymbol)
		if (isAlreadyAdded) return

		if (hasReachedMaxChords) return

		selectedChordSymbols = [...selectedChordSymbols, trimmedSymbol]
		chordSymbolInput = ''
	}

	const handleRemoveChordSymbol = (symbol: string) => {
		selectedChordSymbols = selectedChordSymbols.filter((s) => s !== symbol)
	}

	const handleApplyFilters = () => {
		const bpmMinNumber = bpmMinValue ? parseInt(bpmMinValue, 10) : null
		const bpmMaxNumber = bpmMaxValue ? parseInt(bpmMaxValue, 10) : null

		const filterOptions: FilterOptionsT = {
			searchText: searchText.trim(),
			key: selectedKey === 'All' ? null : selectedKey,
			scale: selectedScale === 'All' ? null : selectedScale,
			bpmMin: bpmMinNumber,
			bpmMax: bpmMaxNumber,
			chordSymbols: selectedChordSymbols,
			chordMatchMode: chordMatchMode
		}

		props.onsubmit(filterOptions)
	}

	const handleClearFilters = () => {
		searchText = ''
		selectedKey = 'All'
		selectedScale = 'All'
		bpmMinValue = ''
		bpmMaxValue = ''
		selectedChordSymbols = []
		chordSymbolInput = ''
		chordMatchMode = 'any'

		const emptyOptions: FilterOptionsT = {
			searchText: '',
			key: null,
			scale: null,
			bpmMin: null,
			bpmMax: null,
			chordSymbols: [],
			chordMatchMode: 'any'
		}

		props.onsubmit(emptyOptions)
	}

	const hasActiveFilters = $derived.by(() => {
		const hasSearch = searchText.trim().length > 0
		const hasKey = selectedKey !== 'All'
		const hasScale = selectedScale !== 'All'
		const hasBpmMin = bpmMinValue.length > 0
		const hasBpmMax = bpmMaxValue.length > 0
		const hasChordSymbols = selectedChordSymbols.length > 0
		return hasSearch || hasKey || hasScale || hasBpmMin || hasBpmMax || hasChordSymbols
	})
</script>

<Box isColumn class="projectsBrowserBar" marginBottom="12px">
	<!-- Row 1: Key, Scale, BPM & Chords -->
	<div class="mb-2 gap-3 flex w-full flex-wrap items-center">
		<!-- Key -->
		<Select.Root type="single" bind:value={selectedKey}>
			<Select.Trigger size="medium" label="Key" value={selectedKey === 'All' ? undefined : selectedKey} />
			<Select.Content>
				{#each MUSICAL_KEYS as key}
					<Select.Item value={key}>{key}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<!-- Scale -->
		<Select.Root type="single" bind:value={selectedScale}>
			<Select.Trigger size="medium" label="Scale" value={selectedScale === 'All' ? undefined : selectedScale} />
			<Select.Content>
				{#each SCALES as scale}
					<Select.Item value={scale}>{scale}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<Divider />

		<!-- BPM -->
		<RangeInput
			label="BPM"
			bind:valueMin={bpmMinValue}
			bind:valueMax={bpmMaxValue}
			min={20}
			max={300}
			placeholderMin="20"
			placeholderMax="300"
			size="large"
		/>

		<Divider />

		<!-- Chord Picker -->
		<Popover.Root bind:open={isChordPickerOpen}>
			<Popover.Trigger size="large" label="Add Chord" />
			<Popover.Content class="p-0 w-[280px]" align="start">
				{#if selectedChordSymbols.length > 0}
					<div class="p-2 gap-2 flex items-center border-b">
						<span class="text-xs text-muted-foreground">Match:</span>
						<button
							class="text-xs px-2 py-1 rounded transition-colors {chordMatchMode === 'any'
								? 'bg-accent text-accent-foreground'
								: 'hover:bg-accent/50'}"
							onclick={() => (chordMatchMode = 'any')}
						>
							Any
						</button>
						<button
							class="text-xs px-2 py-1 rounded transition-colors {chordMatchMode === 'all'
								? 'bg-accent text-accent-foreground'
								: 'hover:bg-accent/50'}"
							onclick={() => (chordMatchMode = 'all')}
						>
							All
						</button>
					</div>
				{/if}
				{#if hasReachedMaxChords}
					<div class="p-3 text-xs text-muted-foreground text-center">Maximum of 4 chords selected</div>
				{:else}
					<div class="p-2 border-b">
						<Input bind:value={chordSymbolInput} placeholder="Search chords..." class="h-8" size="large" autofocus />
					</div>
					<ScrollArea class="h-[200px]">
						<div class="p-2 gap-1 grid grid-cols-3">
							{#each filteredAvailableChords as chord}
								<button
									class="text-xs px-2 py-1.5 rounded hover:bg-accent hover:text-accent-foreground truncate text-left transition-colors"
									onclick={() => handleAddChordSymbol(chord)}
								>
									{chord}
								</button>
							{/each}
							{#if filteredAvailableChords.length === 0}
								<div class="py-4 text-xs text-muted-foreground col-span-3 text-center">No chords found</div>
							{/if}
						</div>
					</ScrollArea>
				{/if}
			</Popover.Content>
		</Popover.Root>

		<!-- Selected Chords -->
		{#each selectedChordSymbols as symbol (symbol)}
			<Badge kind="solid" color="dark" size="medium" class="h-8 px-2 gap-1">
				{symbol}
				<button class="ml-1 hover:text-red-400 transition-colors" onclick={() => handleRemoveChordSymbol(symbol)}>
					<Icon icon="mingcute:close-line" class="size-3" />
				</button>
			</Badge>
		{/each}
	</div>

	<!-- Row 2: Search Input & Actions -->
	<Box gap="12px" marginBottom="8px" isFullWidth align="center">
		<Input size="large" type="text" bind:value={searchText} placeholder="Search projects..." class="bg-white flex-1">
			{#snippet startIcon()}
				<Icon icon="mingcute:search-line" class="searchIcon" />
			{/snippet}
		</Input>

		<Button onclick={handleClearFilters} kind="outline" size="large" class="" disabled={!hasActiveFilters}>Clear</Button>
		<Button onclick={handleApplyFilters} color="dark" size="large" class="h-8">Apply</Button>
	</Box>
</Box>

<style>
	:global .projectsBrowserBar {
		width: 100%;
		gap: 12px;
	}

	:global .searchIcon {
		pointer-events: none;
		opacity: 0.5;
	}
</style>
