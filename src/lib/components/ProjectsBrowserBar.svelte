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
	import Label from './ui/label/label.svelte'
	import chordsByScale from '$lib/constants/chordsByScale.json'
	import Divider from './ui/divider.svelte'

	type FilterOptionsT = {
		searchText: string
		key: string | null
		scale: string | null
		bpmMin: number | null
		bpmMax: number | null
		chordSymbols: string[]
	}

	type ProjectsBrowserBarPropsT = {
		onsubmit: (options: FilterOptionsT) => void
	}

	const props: ProjectsBrowserBarPropsT = $props()

	const MUSICAL_KEYS = ['All', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']
	const SCALES = ['All', 'Major', 'Minor', 'Harmonic Minor']

	const COMMON_CHORDS = [
		'Cmaj7',
		'Dm7',
		'Em7',
		'Fmaj7',
		'G7',
		'Am7',
		'Bm7b5',
		'Amaj7',
		'Bm7',
		'C#m7',
		'Dmaj7',
		'E7',
		'F#m7',
		'G#m7b5',
		'Bbmaj7',
		'Cm7',
		'Dm7',
		'Ebmaj7',
		'F7',
		'Gm7',
		'Am7b5',
		'Gmaj7',
		'Am7',
		'Bm7',
		'Cmaj7',
		'D7',
		'Em7',
		'F#m7b5',
		'Fmaj7',
		'Gm7',
		'Am7',
		'Bbmaj7',
		'C7',
		'Dm7',
		'Em7b5',
		'Emaj7',
		'F#m7',
		'G#m7',
		'Amaj7',
		'B7',
		'C#m7',
		'D#m7b5',
		'Dbmaj7',
		'Ebm7',
		'Fm7',
		'Gbmaj7',
		'Ab7',
		'Bbm7',
		'Cm7b5'
	]

	let searchText = $state('')
	let selectedKey = $state<string>('All')
	let selectedScale = $state<string>('All')
	let bpmMinValue = $state('')
	let bpmMaxValue = $state('')
	let chordSymbolInput = $state('')
	let selectedChordSymbols = $state<string[]>([])
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
		return availableChords.filter((c) => c.toLowerCase().includes(chordSymbolInput.toLowerCase()))
	})

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
			chordSymbols: selectedChordSymbols
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

		const emptyOptions: FilterOptionsT = {
			searchText: '',
			key: null,
			scale: null,
			bpmMin: null,
			bpmMax: null,
			chordSymbols: []
		}

		props.onsubmit(emptyOptions)
	}

	const hasActiveFilters = $derived.by(() => {
		const hasSearch = searchText.trim().length > 0
		const hasKey = selectedKey !== 'All'
		const hasScale = selectedScale !== 'All'
		const hasBpmMin = bpmMinValue.trim().length > 0
		const hasBpmMax = bpmMaxValue.trim().length > 0
		const hasChordSymbols = selectedChordSymbols.length > 0
		return hasSearch || hasKey || hasScale || hasBpmMin || hasBpmMax || hasChordSymbols
	})
</script>

<Box isColumn class="projectsBrowserBar" marginBottom="12px">
	<Box gap="12px" marginBottom="8px" isFullWidth align="center">
		<Input size="medium" type="text" bind:value={searchText} placeholder="Search projects..." class="bg-white flex-1">
			{#snippet startIcon()}
				<Icon icon="mingcute:search-line" class="searchIcon" />
			{/snippet}
		</Input>

		<Divider />

		<Select.Root type="single" bind:value={selectedKey}>
			<Select.Trigger size="medium" label="Key" value={selectedKey === 'All' ? undefined : selectedKey} />
			<Select.Content>
				{#each MUSICAL_KEYS as key}
					<Select.Item value={key}>{key}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<Select.Root type="single" bind:value={selectedScale}>
			<Select.Trigger size="medium" label="Scale" value={selectedScale === 'All' ? undefined : selectedScale} />
			<Select.Content>
				{#each SCALES as scale}
					<Select.Item value={scale}>{scale}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</Box>

	<!-- Row 2: Secondary Filters & Chords -->
	<div class="mb-2 gap-3 flex w-full flex-wrap items-center">
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

		<!-- <div class="h-6 bg-border mx-1 w-px"></div> -->
		<Divider />

		<!-- Chord Picker -->
		<Popover.Root bind:open={isChordPickerOpen}>
			<Popover.Trigger size="large" label="Add Chord" />
			<Popover.Content class="p-0 w-[280px]" align="start">
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

		<!-- Actions -->
		<div class="flex-1"></div>
		{#if hasActiveFilters}
			<Button onclick={handleClearFilters} kind="ghost" size="large" class="h-8 text-muted-foreground">Clear</Button>
		{/if}
		<Button onclick={handleApplyFilters} color="dark" size="large" class="h-8">Apply</Button>
	</div>
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
