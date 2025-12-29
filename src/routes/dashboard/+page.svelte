<script lang="ts">
	import { goto } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'
	import dashboardStore from '$lib/stores/dashboard.svelte'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { fade } from 'svelte/transition'
	import { browser } from '$app/environment'
	import TopBar from '$lib/components/Dashboard/TopBar.svelte'
	import ConfirmDeleteDialog from '$lib/components/Dashboard/ConfirmDeleteDialog.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import ProjectCard from '$lib/components/ProjectCard.svelte'
	import dayjs from 'dayjs'
	import relativeTime from 'dayjs/plugin/relativeTime'
	import ProjectsBrowserBar from '$lib/components/ProjectsBrowserBar.svelte'

	dayjs.extend(relativeTime)

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
	let itemsPerPage = 20

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

	// Load projects when dashboard mounts.
	$effect(() => {
		console.log('[dashboard] Load projects effect:', {
			browser,
			hasAuthUser: !!authStore.authUser,
			userId: authStore.authUser?.id
		})
		if (browser && authStore.authUser) {
			console.log('[dashboard] Loading user projects')
			const offsetValue = (currentPage - 1) * itemsPerPage
			dashboardStore.loadUserProjects(itemsPerPage, offsetValue)
		}
	})

	const handleCreateProject = async () => {
		const project = await dashboardStore.createUserProject()
		if (project) goto(`/project/${project.id}`)
	}

	const handleDeleteProject = (event: Event, id: string, title: string) => {
		event.stopPropagation()
		projectToDelete = { id, title }
		isDeleteDialogOpen = true
	}

	const handleConfirmDelete = () => {
		if (projectToDelete) {
			dashboardStore.deleteUserProject(projectToDelete.id)
			projectToDelete = null
		}
	}

	const handleFilterSubmit = (options: typeof activeFilters) => {
		activeFilters = options
	}

	const filteredProjects = $derived.by(() => {
		let results = dashboardStore.userProjects

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

	const daysAgo = (date: Date) => {
		return dayjs(date).fromNow()
	}

	const handleCloneProject = async (projectId: string) => {
		const clonedProject = await dashboardStore.cloneProject(projectId)
		if (clonedProject) {
			goto(`/project/${clonedProject.id}`)
		}
	}

	const handlePageChange = (page: number) => {
		currentPage = page
		const offsetValue = (page - 1) * itemsPerPage
		dashboardStore.loadUserProjects(itemsPerPage, offsetValue)
	}

	const totalPages = $derived(Math.ceil(dashboardStore.totalProjectsCount / itemsPerPage))
</script>

<div class="dashboard" in:fade>
	<TopBar />

	<main data-page-content-scrollable class="pageMainContent">
		<Box class="pageHeader" isColumn>
			<Box isFullWidth justify="between" align="center" class="pageHeaderRow">
				<h1 class="pageTitle">My Projects</h1>
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
				/>
			{/each}
		</div>

		{#if filteredProjects.length === 0 && dashboardStore.userProjects.length > 0}
			<div class="empty-state">
				<p>No projects match your filters.</p>
			</div>
		{:else if dashboardStore.userProjects.length === 0}
			<div class="empty-state">
				<p>No projects yet. Create one to get started!</p>
			</div>
		{/if}

		{#if dashboardStore.totalProjectsCount > itemsPerPage}
			<Box justify="center" gap="8px" class="mt-6">
				<Button
					onclick={() => handlePageChange(currentPage - 1)}
					disabled={currentPage === 1 || dashboardStore.isLoadingUserProjects}
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
					disabled={currentPage >= totalPages || dashboardStore.isLoadingUserProjects}
					kind="outline"
					size="medium"
				>
					<Icon icon="mingcute:right-line" class="size-4" />
				</Button>
			</Box>
		{/if}
	</main>
</div>

<ConfirmDeleteDialog
	isOpen={isDeleteDialogOpen}
	projectTitle={projectToDelete?.title ?? ''}
	onConfirm={handleConfirmDelete}
	onOpenChange={(open) => {
		isDeleteDialogOpen = open
		if (!open) {
			projectToDelete = null
		}
	}}
/>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--n-01);
	}

	:global .pageHeader {
		margin-bottom: 24px;
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
