<script lang="ts">
	import fuzzy from 'fuzzy'
	import { MagnifyingGlass, Plus, X } from 'phosphor-svelte'
	import { getAllChordSymbols, getScaleChordSymbols } from '$lib/music'
	import SelectControl from '$lib/components/Project/SelectControl.svelte'
	import ValuePopoverButton from '$lib/components/ValuePopoverButton.svelte'

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

	const MAX_CHORD_FILTERS = 4
	const ALL_OPTION_VALUE = 'All'
	const BPM_MIN = 20
	const BPM_MAX = 300
	const SEARCH_DEBOUNCE_MS = 300

	const props: ProjectsBrowserBarPropsT = $props()

	const keyOptions = ['All', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'].map((key) => ({
		value: key,
		label: key
	}))

	const scaleOptions = ['All', 'Major', 'Minor'].map((scale) => ({ value: scale, label: scale }))

	let searchText = $state('')
	let selectedKey = $state(ALL_OPTION_VALUE)
	let selectedScale = $state(ALL_OPTION_VALUE)
	let bpmRange = $state<number[]>([BPM_MIN, BPM_MAX])
	let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined
	let chordSearchText = $state('')
	let selectedChordSymbols = $state<string[]>([])
	let chordMatchMode = $state<'all' | 'any'>('any')
	let isChordPickerOpen = $state(false)

	const availableChords = $derived.by(() => {
		const hasKey = selectedKey !== ALL_OPTION_VALUE
		const hasScale = selectedScale !== ALL_OPTION_VALUE
		if (!hasKey || !hasScale) return getAllChordSymbols()

		return getScaleChordSymbols(selectedKey, selectedScale)
	})

	const visibleChords = $derived.by(() => {
		const hasSearchText = chordSearchText.length > 0
		if (!hasSearchText) return availableChords
		const fuzzyResults = fuzzy.filter(chordSearchText, availableChords)
		return fuzzyResults.map((result) => result.string)
	})

	const hasReachedMaxChords = $derived(selectedChordSymbols.length >= MAX_CHORD_FILTERS)
	const hasSelectedChords = $derived(selectedChordSymbols.length > 0)
	const hasNoVisibleChords = $derived(visibleChords.length === 0)

	const isBpmRangeActive = $derived(bpmRange[0] !== BPM_MIN || bpmRange[1] !== BPM_MAX)
	const bpmRangeValue = $derived(`${bpmRange[0]}–${bpmRange[1]}`)
	const bpmRangeLabel = $derived(isBpmRangeActive ? bpmRangeValue : 'Any')

	const hasActiveFilters = $derived.by(() => {
		const hasSearch = searchText.trim().length > 0
		const hasKey = selectedKey !== ALL_OPTION_VALUE
		const hasScale = selectedScale !== ALL_OPTION_VALUE
		return hasSearch || hasKey || hasScale || isBpmRangeActive || hasSelectedChords
	})

	const buildFilterOptions = (): FilterOptionsT => {
		const key = selectedKey === ALL_OPTION_VALUE ? null : selectedKey
		const scale = selectedScale === ALL_OPTION_VALUE ? null : selectedScale
		const bpmMin = bpmRange[0] === BPM_MIN ? null : bpmRange[0]
		const bpmMax = bpmRange[1] === BPM_MAX ? null : bpmRange[1]

		return {
			searchText: searchText.trim(),
			key,
			scale,
			bpmMin,
			bpmMax,
			chordSymbols: selectedChordSymbols,
			chordMatchMode
		}
	}

	const applyFilters = () => {
		clearTimeout(searchDebounceTimer)
		props.onsubmit(buildFilterOptions())
	}

	const handleSearchInput = (event: CustomEvent) => {
		searchText = event.detail.value
		clearTimeout(searchDebounceTimer)
		searchDebounceTimer = setTimeout(applyFilters, SEARCH_DEBOUNCE_MS)
	}

	const handleSearchKeyDown = (event: KeyboardEvent) => {
		const isEnterKey = event.key === 'Enter'
		if (isEnterKey) applyFilters()
	}

	const handleKeyChange = (nextKey: string) => {
		selectedKey = nextKey
		applyFilters()
	}

	const handleScaleChange = (nextScale: string) => {
		selectedScale = nextScale
		applyFilters()
	}

	const handleBpmRangeChange = (event: CustomEvent) => {
		const nextRange: number[] = event.detail.value
		bpmRange = nextRange
		applyFilters()
	}

	const handleChordPickerToggle = (event: CustomEvent) => {
		isChordPickerOpen = event.detail.open
	}

	const handleChordSearchInput = (event: CustomEvent) => {
		chordSearchText = event.detail.value
	}

	const handleMatchModeChange = (nextMode: 'all' | 'any') => {
		chordMatchMode = nextMode
		if (hasSelectedChords) applyFilters()
	}

	const handleAddChordSymbol = (symbol: string) => {
		const isAlreadyAdded = selectedChordSymbols.includes(symbol)
		if (isAlreadyAdded) return
		if (hasReachedMaxChords) return
		selectedChordSymbols = [...selectedChordSymbols, symbol]
		chordSearchText = ''
		applyFilters()
	}

	const handleRemoveChordSymbol = (symbol: string) => {
		selectedChordSymbols = selectedChordSymbols.filter((selectedSymbol) => selectedSymbol !== symbol)
		applyFilters()
	}

	const handleRemoveChordBadge = (event: CustomEvent) => {
		const symbol: string = event.detail.value
		handleRemoveChordSymbol(symbol)
	}

	const handleClearFilters = () => {
		searchText = ''
		selectedKey = ALL_OPTION_VALUE
		selectedScale = ALL_OPTION_VALUE
		bpmRange = [BPM_MIN, BPM_MAX]
		selectedChordSymbols = []
		chordSearchText = ''
		chordMatchMode = 'any'
		applyFilters()
	}
</script>

<z-row gap="md" doesWrap alignsY="center" isFullWidth class="filterBar">
	<div class="filterSearch">
		<z-input
			type="search"
			value={searchText}
			placeholder="Search projects…"
			label="Search projects"
			size="sm"
			oninput={handleSearchInput}
			onkeydown={handleSearchKeyDown}
		>
			<z-box slot="prefix" isInline><MagnifyingGlass size={14} /></z-box>
		</z-input>
	</div>

	<SelectControl label="Key" value={selectedKey} options={keyOptions} onValueChange={handleKeyChange} />
	<SelectControl label="Scale" value={selectedScale} options={scaleOptions} onValueChange={handleScaleChange} />

	<ValuePopoverButton label="BPM range" eyebrowLabel="BPM" valueLabel={bpmRangeLabel} isActive={isBpmRangeActive}>
		<z-range
			min={BPM_MIN}
			max={BPM_MAX}
			step={1}
			value={bpmRange}
			label="BPM range"
			doesShowValue
			onchange={handleBpmRangeChange}
		></z-range>
	</ValuePopoverButton>

	<z-row gap="xs" alignsY="center" doesWrap>
		<z-text size="xs" color="muted" weight={600} class="filterLabel">Chords</z-text>

		<z-popover placement="bottom-start" isOpen={isChordPickerOpen} ontoggle={handleChordPickerToggle}>
			<z-button slot="trigger" kind="outline" size="sm">
				<Plus size={14} weight="bold" />
				Add chord
			</z-button>

			<z-column gap="sm" class="chordPicker">
				<z-toggle-button-group size="sm" kind="outline">
					<z-toggle-button-group-item
						value="any"
						isPressed={chordMatchMode === 'any'}
						onpress={() => handleMatchModeChange('any')}>Match any</z-toggle-button-group-item
					>
					<z-toggle-button-group-item
						value="all"
						isPressed={chordMatchMode === 'all'}
						onpress={() => handleMatchModeChange('all')}>Match all</z-toggle-button-group-item
					>
				</z-toggle-button-group>

				{#if hasReachedMaxChords}
					<z-text size="sm" color="muted">You can filter by up to {MAX_CHORD_FILTERS} chords.</z-text>
				{:else}
					<z-input value={chordSearchText} placeholder="Search chords…" size="sm" label="Search chords" oninput={handleChordSearchInput}>
						<z-box slot="prefix" isInline><MagnifyingGlass size={14} /></z-box>
					</z-input>

					<z-scroll maxHeight="12rem">
						<z-grid columns="3" gap="2xs">
							{#each visibleChords as chord (chord)}
								<z-button kind="ghost" size="sm" onclick={() => handleAddChordSymbol(chord)}>{chord}</z-button>
							{/each}
						</z-grid>
						{#if hasNoVisibleChords}
							<z-text size="sm" color="muted">No chords found</z-text>
						{/if}
					</z-scroll>
				{/if}
			</z-column>
		</z-popover>

		<!--
			Each badge sits in a span on purpose. z-badge defines a "remove" event,
			which shadows the DOM's own element.remove(). Svelte removes the keyed
			block's root with element.remove(), so a bare z-badge would fire the
			event instead of leaving the page. The span is what Svelte removes.
		-->
		{#each selectedChordSymbols as symbol (symbol)}
			<span class="chordChip">
				<z-badge
					kind="soft"
					tone="primary"
					size="sm"
					value={symbol}
					label={symbol}
					isRemovable
					onremove={handleRemoveChordBadge}
				></z-badge>
			</span>
		{/each}
	</z-row>

	{#if hasActiveFilters}
		<z-button kind="ghost" size="sm" onclick={handleClearFilters}>
			<X size={14} />
			Clear
		</z-button>
	{/if}
</z-row>

<style>
	.filterBar {
		padding-block: var(--space-xs);
	}

	.filterSearch {
		flex: 1 1 14rem;
		max-width: 20rem;
		min-width: 12rem;
	}

	.filterLabel {
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.chordChip {
		display: inline-flex;
	}

	.chordPicker {
		min-width: 18rem;
	}
</style>
