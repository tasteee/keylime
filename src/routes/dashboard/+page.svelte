<script lang="ts">
	import { goto } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { fade } from 'svelte/transition'
	import { browser } from '$app/environment'
	import TopBar from '$lib/components/Dashboard/TopBar.svelte'
	import ConfirmDeleteDialog from '$lib/components/Dashboard/ConfirmDeleteDialog.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import ProjectCard from '$lib/components/ProjectCard.svelte'
	import { daysAgo } from '$lib/modules/dateTime'
	import ProjectsBrowserBar from '$lib/components/ProjectsBrowserBar.svelte'
	import { addProject, deleteProjectById, getProjectsByUserId, cloneProjectById } from '$lib/modules/database'
	import { createNewProjectData } from '$lib/modules/projects'
	import { calculateStartTimes } from '$lib/helpers/progression'

	type PropsT = {
		data: {
			activeUser: UserT | null
			projects: ProjectT[]
		}
	}

	const props: PropsT = $props()

	let userProjects = $state<ProjectT[]>([])
	let isLoadingUserProjects = $state(false)
	let totalProjectsCount = $state(0)
	let isDeleteDialogOpen = $state(false)
	let projectToDelete = $state<{ id: string; title: string } | null>(null)
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
			octave: String(project.octave),
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
		console.log('[dashboard] Auth check effect:', {
			browser,
			isLoading: authStore.isLoading,
			hasAuthUser: !!authStore.authUser,
			userId: authStore.authUser?.id
		})
		if (browser && !authStore.isLoading && !authStore.authUser) {
			console.log('[dashboard] No auth user, redirecting to /auth/login')
			goto('/auth/login')
		}
	})

	const loadUserProjects = async (limit: number = 20, offset: number = 0) => {
		if (!authStore.authUser) return
		isLoadingUserProjects = true

		const results = await getProjectsByUserId(authStore.authUser.id, limit, offset)
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
		const userId = props.data.activeUser.id
		const newProjectData = createNewProjectData(userId)
		const result = await addProject(newProjectData)
		console.log('\n\n\nhandleCreateProject result:', { result, newProjectData, userId })
		if (!result.data) return
		const project = result.data as ProjectT
		goto(`/project/${project.id}`)
	}

	const handleDeleteProject = async (id: string) => {
		await deleteProjectById(id)
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
		goto(`/project/${id}`)
	}

	const handleCloneProject = async (projectId: string) => {
		if (!authStore.authUser) return
		const result = await cloneProjectById(projectId, authStore.authUser.id)
		if (result.data) {
			await loadUserProjects()
			goto(`/project/${result.data.id}`)
		}
	}

	const handlePageChange = (page: number) => {
		currentPage = page
		const offsetValue = (page - 1) * itemsPerPage
		loadUserProjects(itemsPerPage, offsetValue)
	}

	const totalPages = $derived(Math.ceil(totalProjectsCount / itemsPerPage))
</script>

<div class="dashboard" in:fade>
	<TopBar />

	<main data-page-content-scrollable class="pageMainContent">
		<Box class="pageContentHeader" isColumn>
			<Box isFullWidth justify="between" align="center">
				<h1 class="pageTitle">Your Projects</h1>
				<Button onclick={handleCreateProject} size="medium" color="brand">
					<Icon icon="mingcute:add-line" class="mr-2 size-4" />
					New Project
				</Button>
			</Box>
			<p class="pageSubtitle">Look at all these bangers.</p>
		</Box>

		<ProjectsBrowserBar onsubmit={handleFilterSubmit} />

		<div class="projects-grid">
			{#each filteredProjects as project (project.id)}
				<ProjectCard
					{project}
					daysAgo={daysAgo(project.updatedAt)}
					onOpenProject={handleOpenProject}
					onCloneProject={handleCloneProject}
					onDeleteProject={handleDeleteProject}
				/>
			{/each}
		</div>

		{#if filteredProjects.length === 0 && userProjects.length > 0}
			<div class="empty-state">
				<p>No projects match your filters.</p>
			</div>
		{:else if userProjects.length === 0}
			<div class="empty-state">
				<p>No projects yet. Create one to get started!</p>
			</div>
		{/if}

		{#if totalProjectsCount > itemsPerPage}
			<Box justify="center" gap="8px" class="mt-6">
				<Button
					onclick={() => handlePageChange(currentPage - 1)}
					disabled={currentPage === 1 || isLoadingUserProjects}
					kind="outline"
					size="medium"
				>
					<Icon icon="mingcute:left-line" class="size-4" />
				</Button>
				<span class="text-sm text-muted-foreground">
					Page {currentPage} of {totalPages}
				</span>
				<Button
					onclick={() => handlePageChange(currentPage + 1)}
					disabled={currentPage >= totalPages || isLoadingUserProjects}
					kind="outline"
					size="medium"
				>
					<Icon icon="mingcute:right-line" class="size-4" />
				</Button>
			</Box>
		{/if}
	</main>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--n-01);
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 24px;
	}

	.empty-state {
		text-align: center;
		padding: 60px;
		color: var(--n-05);
	}
</style>
