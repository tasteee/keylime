<script lang="ts">
	import { Books, CaretRight } from 'phosphor-svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { getPatternLibrary, buildLibraryPattern } from '$lib/helpers/patternLibrary'
	import { createChord } from '$lib/music'

	const projectEditor = useProjectEditor()
	const library = getPatternLibrary()
	const FALLBACK_CHORD_SYMBOL = 'C'

	let isOpen = $state(false)
	let activeCategoryName = $state(library[0]?.name ?? '')
	let activeSubcategoryName = $state(library[0]?.subcategories[0]?.name ?? '')

	const activeCategory = $derived(library.find((category) => category.name === activeCategoryName))
	const subcategories = $derived(activeCategory?.subcategories ?? [])
	const activeSubcategory = $derived(subcategories.find((subcategory) => subcategory.name === activeSubcategoryName))
	const patterns = $derived(activeSubcategory?.patterns ?? [])

	// Patterns are adapted to the selected chord, then the first chord, then C.
	const getReferenceChord = (): ChordT => {
		const project = projectEditor.state.project
		const chords = project.progressionChords.filter((item): item is ProgressionChordT => item.type === 'chord')
		const selectedId = projectEditor.state.selectedProgressionItemId
		const selectedChord = chords.find((chord) => chord.id === selectedId)
		const referenceChord = selectedChord ?? chords[0]
		return referenceChord ?? createChord(FALLBACK_CHORD_SYMBOL)
	}

	const handleToggle = (event: CustomEvent) => {
		isOpen = event.detail.open
	}

	const handleCategoryClick = (categoryName: string) => {
		const category = library.find((candidate) => candidate.name === categoryName)
		activeCategoryName = categoryName
		activeSubcategoryName = category?.subcategories[0]?.name ?? ''
	}

	const handleSubcategoryClick = (subcategoryName: string) => {
		activeSubcategoryName = subcategoryName
	}

	const handlePatternClick = (templateId: string) => {
		const project = projectEditor.state.project
		const libraryPattern = buildLibraryPattern({
			templateId,
			referenceChord: getReferenceChord(),
			key: project.key,
			scale: project.scale,
			octave: project.octave
		})
		if (!libraryPattern) return
		projectEditor.replacePattern(libraryPattern)
		isOpen = false
	}
</script>

<z-popover placement="bottom-start" isOpen={isOpen} ontoggle={handleToggle}>
	<z-button slot="trigger" kind="outline" size="sm" aria-label="Pattern library">
		<Books size={16} weight="bold" />
		Library
	</z-button>

	<div class="pattern-library">
		<z-scroll maxHeight="20rem" class="pattern-library-column">
			<z-column gap="2xs">
				{#each library as category (category.name)}
					<z-button
						kind={category.name === activeCategoryName ? 'soft' : 'ghost'}
						size="sm"
						onclick={() => handleCategoryClick(category.name)}
					>
						{category.name}
						<CaretRight size={12} weight="bold" />
					</z-button>
				{/each}
			</z-column>
		</z-scroll>

		<z-scroll maxHeight="20rem" class="pattern-library-column">
			<z-column gap="2xs">
				{#each subcategories as subcategory (subcategory.name)}
					<z-button
						kind={subcategory.name === activeSubcategoryName ? 'soft' : 'ghost'}
						size="sm"
						onclick={() => handleSubcategoryClick(subcategory.name)}
					>
						{subcategory.name}
						<CaretRight size={12} weight="bold" />
					</z-button>
				{/each}
			</z-column>
		</z-scroll>

		<z-scroll maxHeight="20rem" class="pattern-library-column">
			<z-column gap="2xs">
				{#each patterns as pattern (pattern.id)}
					<z-button kind="ghost" size="sm" onclick={() => handlePatternClick(pattern.id)}>
						{pattern.name}
					</z-button>
				{/each}
			</z-column>
		</z-scroll>
	</div>
</z-popover>

<style>
	.pattern-library {
		display: grid;
		grid-template-columns: 9rem 11rem 14rem;
		gap: var(--spacing-2);
	}

	.pattern-library-column {
		min-width: 0;
	}
</style>
