<script lang="ts">
	import fuzzy from 'fuzzy'
	import { MagnifyingGlass, Plus } from 'phosphor-svelte'
	import ALL_CHORD_NAMES from '$lib/constants/allChordNames.json'
	import chordsByScale from '$lib/constants/chordsByScale.json'

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

	const props: ProjectsBrowserBarPropsT = $props()

	const keyOptions = ['All', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'].map((key) => ({
		value: key,
		label: key
	}))

	const scaleOptions = ['All', 'Major', 'Minor'].map((scale) => ({ value: scale, label: scale }))

	let searchText = $state('')
	let selectedKey = $state(ALL_OPTION_VALUE)
	let selectedScale = $state(ALL_OPTION_VALUE)
	let bpmMinValue = $state<number | undefined>(undefined)
	let bpmMaxValue = $state<number | undefined>(undefined)
	let chordSearchText = $state('')
	let selectedChordSymbols = $state<string[]>([])
	let chordMatchMode = $state<'all' | 'any'>('any')
	let isChordPickerOpen = $state(false)

	const availableChords = $derived.by(() => {
		const hasKey = selectedKey !== ALL_OPTION_VALUE
		const hasScale = selectedScale !== ALL_OPTION_VALUE
		if (!hasKey || !hasScale) return ALL_CHORD_NAMES

		const scaleName = `${selectedKey} ${selectedScale}`
		const chordsForScale = (chordsByScale as Record<string, string[]>)[scaleName]
		return chordsForScale ?? ALL_CHORD_NAMES
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

	const hasActiveFilters = $derived.by(() => {
		const hasSearch = searchText.trim().length > 0
		const hasKey = selectedKey !== ALL_OPTION_VALUE
		const hasScale = selectedScale !== ALL_OPTION_VALUE
		const hasBpmMin = bpmMinValue !== undefined
		const hasBpmMax = bpmMaxValue !== undefined
		return hasSearch || hasKey || hasScale || hasBpmMin || hasBpmMax || hasSelectedChords
	})

	const handleSearchInput = (event: CustomEvent) => {
		searchText = event.detail.value
	}

	const handleSearchKeyDown = (event: KeyboardEvent) => {
		const isEnterKey = event.key === 'Enter'
		if (isEnterKey) handleApplyFilters()
	}

	const handleKeyChange = (event: CustomEvent) => {
		selectedKey = event.detail.value
	}

	const handleScaleChange = (event: CustomEvent) => {
		selectedScale = event.detail.value
	}

	const handleBpmMinChange = (event: CustomEvent) => {
		const rawValue = event.detail.value
		bpmMinValue = Number.isFinite(rawValue) ? rawValue : undefined
	}

	const handleBpmMaxChange = (event: CustomEvent) => {
		const rawValue = event.detail.value
		bpmMaxValue = Number.isFinite(rawValue) ? rawValue : undefined
	}

	const handleChordPickerToggle = (event: CustomEvent) => {
		isChordPickerOpen = event.detail.open
	}

	const handleChordSearchInput = (event: CustomEvent) => {
		chordSearchText = event.detail.value
	}

	const handleMatchModeChange = (nextMode: 'all' | 'any') => {
		chordMatchMode = nextMode
	}

	const handleAddChordSymbol = (symbol: string) => {
		const isAlreadyAdded = selectedChordSymbols.includes(symbol)
		if (isAlreadyAdded) return
		if (hasReachedMaxChords) return
		selectedChordSymbols = [...selectedChordSymbols, symbol]
		chordSearchText = ''
	}

	const handleRemoveChordSymbol = (symbol: string) => {
		selectedChordSymbols = selectedChordSymbols.filter((selectedSymbol) => selectedSymbol !== symbol)
	}

	const buildFilterOptions = (): FilterOptionsT => {
		const key = selectedKey === ALL_OPTION_VALUE ? null : selectedKey
		const scale = selectedScale === ALL_OPTION_VALUE ? null : selectedScale

		return {
			searchText: searchText.trim(),
			key,
			scale,
			bpmMin: bpmMinValue ?? null,
			bpmMax: bpmMaxValue ?? null,
			chordSymbols: selectedChordSymbols,
			chordMatchMode
		}
	}

	const handleApplyFilters = () => {
		props.onsubmit(buildFilterOptions())
	}

	const handleClearFilters = () => {
		searchText = ''
		selectedKey = ALL_OPTION_VALUE
		selectedScale = ALL_OPTION_VALUE
		bpmMinValue = undefined
		bpmMaxValue = undefined
		selectedChordSymbols = []
		chordSearchText = ''
		chordMatchMode = 'any'
		props.onsubmit(buildFilterOptions())
	}
</script>

<z-surface level="1" kind="soft" inset="md" radius="lg" isBordered isFullWidth>
	<z-column gap="md">
		<z-row gap="md" doesWrap alignsY="end">
			<z-field class="filterField" label="Key" size="sm">
				<z-select value={selectedKey} options={keyOptions} size="sm" isInline onchange={handleKeyChange}></z-select>
			</z-field>

			<z-field class="filterField" label="Scale" size="sm">
				<z-select value={selectedScale} options={scaleOptions} size="sm" isInline onchange={handleScaleChange}></z-select>
			</z-field>

			<z-field class="filterField" label="Min BPM" size="sm">
				<z-number-input value={bpmMinValue} min={20} max={300} placeholder="20" size="sm" onchange={handleBpmMinChange}
				></z-number-input>
			</z-field>

			<z-field class="filterField" label="Max BPM" size="sm">
				<z-number-input value={bpmMaxValue} min={20} max={300} placeholder="300" size="sm" onchange={handleBpmMaxChange}
				></z-number-input>
			</z-field>

			<z-field class="filterField" label="Chords" size="sm">
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
			</z-field>

			{#each selectedChordSymbols as symbol (symbol)}
				<z-badge
					kind="solid"
					tone="primary"
					value={symbol}
					label={symbol}
					isRemovable
					onremove={() => handleRemoveChordSymbol(symbol)}
				></z-badge>
			{/each}
		</z-row>

		<z-row gap="sm" alignsY="center">
			<z-input
				type="search"
				value={searchText}
				placeholder="Search projects…"
				label="Search projects"
				oninput={handleSearchInput}
				onkeydown={handleSearchKeyDown}
			>
				<z-box slot="prefix" isInline><MagnifyingGlass size={16} /></z-box>
			</z-input>

			<z-button kind="outline" isDisabled={!hasActiveFilters} onclick={handleClearFilters}>Clear</z-button>
			<z-button tone="primary" onclick={handleApplyFilters}>Apply</z-button>
		</z-row>
	</z-column>
</z-surface>

<style>
	/* z-field fills its row by default. Let the fields in the row hug their controls. */
	.filterField {
		width: auto;
	}

	.chordPicker {
		min-width: 18rem;
	}
</style>
