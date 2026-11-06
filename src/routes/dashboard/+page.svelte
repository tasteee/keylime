<script lang="ts">
	import { goToPath } from '$lib/modules/navigate'
	import { Plus, MusicNotes, FunnelSimple } from 'phosphor-svelte'
	import { browser } from '$app/environment'
	import PageLayout from '$lib/components/PageLayout.svelte'
	import PageHeader from '$lib/components/PageHeader.svelte'
	import ProjectCard from '$lib/components/ProjectCard.svelte'
	import ConfirmDeleteDialog from '$lib/components/Dashboard/ConfirmDeleteDialog.svelte'
	import { daysAgo } from '$lib/modules/dateTime'
	import ProjectsBrowserBar from '$lib/components/ProjectsBrowserBar.svelte'
	import { addProject, deleteProjectById, getProjectsByUserId, cloneProjectById } from '$lib/modules/database'
	import { createNewProjectData } from '$lib/modules/projects'
	import { calculateStartTimes } from '$lib/helpers/progression'

	type PropsT = {
		data: {
			activeUser: UserT | null
			authUser: { id: string } | null
			projects: ProjectT[]
			isAuthenticated: boolean
		}
	}

	const props: PropsT = $props()

	let userProjects = $state<ProjectT[]>([])
	let isLoadingUserProjects = $state(false)
	let totalProjectsCount = $state(0)
	let projectPendingDeletion = $state<ProjectT | null>(null)
	let activeFilters = $state({
		searchText: '',
		key: null as string | null,
		scale: null as string | null,
		bpmMin: null as number | null,
		bpmMax: null as number | null,
		chordSymbols: [] as string[],
		chordMatchMode: 'any' as 'all' | 'any'
	})

	let currentPage = $state(1)
	const itemsPerPage = 20

	const parseProjectData = (project: ProjectT): ProjectT => {
		const parsedProgressionChords =
			typeof project.progressionChords === 'string' ? JSON.parse(project.progressionChords) : project.progressionChords

		const progressionChordsWithStartTime = calculateStartTimes({ items: parsedProgressionChords })

		return {
			...project,
			updatedAt: new Date(project.updatedAt),
			createdAt: new Date(project.createdAt),
			octave: Number(project.octave),
			progressionChords: progressionChordsWithStartTime,
			patternSignals:
				typeof project.patternSignals === 'string' ? JSON.parse(project.patternSignals) : project.patternSignals,
			patternSignalRows:
				typeof project.patternSignalRows === 'string' ? JSON.parse(project.patternSignalRows) : project.patternSignalRows
		}
	}

	// Initialize with SSR data
	$effect(() => {
		if (browser && props.data.projects.length > 0) {
			userProjects = props.data.projects.map(parseProjectData)
			totalProjectsCount = props.data.projects.length
		}
	})

	// Redirect if not authenticated
	$effect(() => {
		if (browser && !props.data.isAuthenticated) {
			console.log('[dashboard] Not authenticated, redirecting to /auth/login')
			goToPath('/auth/login')
		}
	})

	const loadUserProjects = async (limit: number = 20, offset: number = 0) => {
		if (!props.data.activeUser) return
		isLoadingUserProjects = true

		const results = await getProjectsByUserId(props.data.activeUser.id, limit, offset)
		const projects = (results.data || []) as ProjectT[]

		if (results.error) {
			console.error('Error loading user projects:', results.error)
			isLoadingUserProjects = false
			return
		}

		totalProjectsCount = results.totalCount || 0
		userProjects = projects.map(parseProjectData)
		isLoadingUserProjects = false
	}

	const handleCreateProject = async () => {
		const userId = props.data.activeUser?.id ?? props.data.authUser?.id
		if (!userId) return
		const newProjectData = createNewProjectData(userId)
		const result = await addProject(newProjectData)
		console.log('\n\n\nhandleCreateProject result:', { result, newProjectData, userId })
		if (!result.data) return
		const project = result.data as ProjectT
		goToPath(`/project/${project.id}`)
	}

	const handleRequestDeleteProject = (projectId: string) => {
		const projectToDelete = userProjects.find((project) => project.id === projectId)
		projectPendingDeletion = projectToDelete ?? null
	}

	const handleCancelDeleteProject = () => {
		projectPendingDeletion = null
	}

	const handleConfirmDeleteProject = async () => {
		const projectToDelete = projectPendingDeletion
		projectPendingDeletion = null
		if (!projectToDelete) return
		await deleteProjectById(projectToDelete.id)
		await loadUserProjects()
	}

	const handleFilterSubmit = (options: typeof activeFilters) => {
		activeFilters = options
	}

	const filteredProjects = $derived.by(() => {
		let results = userProjects

		// Filter by search text
		const hasSearchText = activeFilters.searchText.trim().length > 0
		if (hasSearchText) {
			const query = activeFilters.searchText.toLowerCase()
			results = results.filter((project) => {
				const matchesTitle = project.title.toLowerCase().includes(query)
				const matchesDescription = project.description.toLowerCase().includes(query)
				return matchesTitle || matchesDescription
			})
		}

		// Filter by key
		const hasKeyFilter = activeFilters.key !== null
		if (hasKeyFilter) {
			results = results.filter((project) => project.key === activeFilters.key)
		}

		// Filter by scale
		const hasScaleFilter = activeFilters.scale !== null
		if (hasScaleFilter) {
			results = results.filter((project) => project.scale === activeFilters.scale)
		}

		// Filter by BPM range
		const hasBpmMin = activeFilters.bpmMin !== null
		const hasBpmMax = activeFilters.bpmMax !== null
		if (hasBpmMin || hasBpmMax) {
			results = results.filter((project) => {
				const bpmMin = activeFilters.bpmMin ?? 0
				const bpmMax = activeFilters.bpmMax ?? 999
				const meetsMin = project.bpm >= bpmMin
				const meetsMax = project.bpm <= bpmMax
				return meetsMin && meetsMax
			})
		}

		// Filter by chord symbols
		const hasChordSymbolsFilter = activeFilters.chordSymbols.length > 0
		if (hasChordSymbolsFilter) {
			const isMatchAll = activeFilters.chordMatchMode === 'all'
			results = results.filter((project) => {
				const projectChords = project.chordSymbols || []
				if (isMatchAll) {
					const hasAllChords = activeFilters.chordSymbols.every((filterChord) => {
						return projectChords.includes(filterChord)
					})
					return hasAllChords
				}
				const hasAnyChord = activeFilters.chordSymbols.some((filterChord) => {
					return projectChords.includes(filterChord)
				})
				return hasAnyChord
			})
		}

		return results
	})

	const handleOpenProject = (id: string) => {
		goToPath(`/project/${id}`)
	}

	const handleCloneProject = async (projectId: string) => {
		if (!props.data.activeUser) return
		const result = await cloneProjectById(projectId, props.data.activeUser.id)
		if (result.data) {
			await loadUserProjects()
			goToPath(`/project/${result.data.id}`)
		}
	}

	const handlePageChange = (page: number) => {
		currentPage = page
		const offsetValue = (page - 1) * itemsPerPage
		loadUserProjects(itemsPerPage, offsetValue)
	}

	const totalPages = $derived(Math.ceil(totalProjectsCount / itemsPerPage))
	const isDeleteDialogOpen = $derived(projectPendingDeletion !== null)
	const pendingDeletionTitle = $derived(projectPendingDeletion?.title ?? '')
	const hasMultiplePages = $derived(totalProjectsCount > itemsPerPage)
	const hasNoProjectsAtAll = $derived(userProjects.length === 0)
	const hasNoMatchingProjects = $derived(filteredProjects.length === 0 && userProjects.length > 0)

	const handlePaginationChange = (event: CustomEvent) => {
		handlePageChange(event.detail.page)
	}
</script>

<PageLayout>
	<PageHeader title="Your projects" subtitle="Look at all these bangers.">
		{#snippet actions()}
			<z-button tone="primary" onclick={handleCreateProject}>
				<Plus size={16} weight="bold" />
				New project
			</z-button>
		{/snippet}
	</PageHeader>

	<ProjectsBrowserBar onsubmit={handleFilterSubmit} />

	<z-grid minColumnWidth="20rem" gap="md">
		{#each filteredProjects as project (project.id)}
			<ProjectCard
				{project}
				daysAgo={daysAgo(project.updatedAt)}
				onOpenProject={handleOpenProject}
				onCloneProject={handleCloneProject}
				onDeleteProject={handleRequestDeleteProject}
			/>
		{/each}
	</z-grid>

	{#if hasNoMatchingProjects}
		<z-empty-state heading="No matches" description="No projects match your filters. Try loosening them." isBordered>
			<z-box slot="icon" isInline><FunnelSimple size={32} /></z-box>
		</z-empty-state>
	{/if}

	{#if hasNoProjectsAtAll}
		<z-empty-state heading="No projects yet" description="Create one to get started!" isBordered>
			<z-box slot="icon" isInline><MusicNotes size={32} /></z-box>
			<z-button tone="primary" onclick={handleCreateProject}>
				<Plus size={16} weight="bold" />
				New project
			</z-button>
		</z-empty-state>
	{/if}

	{#if hasMultiplePages}
		<z-row alignsX="center">
			<z-pagination page={currentPage} total={totalPages} onchange={handlePaginationChange}></z-pagination>
		</z-row>
	{/if}
</PageLayout>

<ConfirmDeleteDialog
	isOpen={isDeleteDialogOpen}
	projectTitle={pendingDeletionTitle}
	onConfirm={handleConfirmDeleteProject}
	onCancel={handleCancelDeleteProject}
/>
