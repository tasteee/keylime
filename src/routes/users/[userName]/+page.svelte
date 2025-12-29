<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { goto } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'
	import { fade } from 'svelte/transition'
	import TopBar from '$lib/components/Dashboard/TopBar.svelte'
	import { cloneProjectById } from '$lib/modules/database'
	import ProjectCard from '$lib/components/ProjectCard.svelte'
	import ProjectsBrowserBar from '$lib/components/ProjectsBrowserBar.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import dayjs from 'dayjs'
	import relativeTime from 'dayjs/plugin/relativeTime'
	import { browser } from '$app/environment'
	import { calculateStartTimes } from '$lib/helpers/progression'

	dayjs.extend(relativeTime)

	type UserProfilePagePropsT = {
		data: {
			user: UserT | null
			projects: ProjectT[]
		}
	}

	const props: UserProfilePagePropsT = $props()

	let userProfile = $state<UserT | null>(null)
	let projects = $state<ProjectT[]>([])
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

	const parseProjectData = (project: ProjectT): ProjectT => {
		const parsedProgressionChords =
			typeof project.progressionChords === 'string' ? JSON.parse(project.progressionChords) : project.progressionChords

		const progressionChordsWithStartTime = calculateStartTimes({ items: parsedProgressionChords })

		return {
			...project,
			updatedAt: new Date(project.updatedAt),
			createdAt: new Date(project.createdAt),
			octave: String(project.octave),
			progressionChords: progressionChordsWithStartTime as any,
			patternSignals:
				typeof project.patternSignals === 'string' ? JSON.parse(project.patternSignals) : project.patternSignals,
			patternSignalRows:
				typeof project.patternSignalRows === 'string' ? JSON.parse(project.patternSignalRows) : project.patternSignalRows
		}
	}

	$effect(() => {
		if (browser && props.data.user) {
			userProfile = {
				...props.data.user,
				updatedAt: new Date(props.data.user.updatedAt),
				createdAt: new Date(props.data.user.createdAt)
			}
		}
	})

	$effect(() => {
		if (browser && props.data.projects.length > 0) {
			projects = props.data.projects.map(parseProjectData)
		}
	})

	const handleOpenProject = (projectId: string) => {
		goto(`/project/${projectId}`)
	}

	const handleGoBack = () => {
		goto('/users')
	}

	const formatDate = (date: Date) => {
		return dayjs(date).format('MMMM D, YYYY')
	}

	const daysAgo = (date: Date) => {
		return dayjs(date).fromNow()
	}

	const handleCloneProject = async (projectId: string) => {
		if (!authStore.authUser) return
		const result = await cloneProjectById(projectId, authStore.authUser.id)
		if (result.data) {
			goto(`/project/${result.data.id}`)
		}
	}

	const handleFilterSubmit = (options: typeof activeFilters) => {
		activeFilters = options
		currentPage = 1
	}

	const filteredProjects = $derived.by(() => {
		let results = projects

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

	const paginatedProjects = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage
		const endIndex = startIndex + itemsPerPage
		return filteredProjects.slice(startIndex, endIndex)
	})

	const totalPages = $derived(Math.ceil(filteredProjects.length / itemsPerPage))

	const handlePageChange = (page: number) => {
		currentPage = page
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const isOwnProfile = $derived.by(() => {
		return authStore.userProfile?.userName === userProfile?.userName
	})
</script>

<div class="pageContainer" in:fade>
	<TopBar />

	<main data-page-content-scrollable class="pageMainContent">
		{#if !userProfile}
			<div class="error-state">
				<Icon icon="mingcute:user-3-line" class="size-16 mb-4 opacity-30" />
				<h2>User Not Found</h2>
				<p>The user could not be found.</p>
				<Button onclick={handleGoBack} class="mt-4">Back to Users</Button>
			</div>
		{:else}
			<Box class="pageHeader" isColumn>
				<Box isFullWidth justify="start" align="center" gap="24px" class="pageHeaderRow">
					<div class="header-avatar">
						{#if userProfile.avatarUrl}
							<img src={userProfile.avatarUrl} alt={userProfile.userName} />
						{:else}
							<Icon icon="mingcute:user-3-line" class="size-12" />
						{/if}
					</div>
					<Box isColumn gap="8px">
						<h1 class="pageTitle">@{userProfile.userName}</h1>
						<p class="pageBio">{userProfile.bio || 'No bio yet'}</p>
						<p class="pageJoined">
							<Icon icon="mingcute:time-line" class="inline-icon" />
							Joined {formatDate(userProfile.createdAt)}
						</p>
					</Box>
				</Box>
			</Box>

			<ProjectsBrowserBar onsubmit={handleFilterSubmit} />

			<Box isColumn class="section-header">
				<h2 class="section-title">Public Projects</h2>
				<p class="section-subtitle">
					{filteredProjects.length}
					{filteredProjects.length === 1 ? 'project' : 'projects'}
					{#if filteredProjects.length !== projects.length}
						(filtered from {projects.length} total)
					{/if}
				</p>
			</Box>

			{#if paginatedProjects.length === 0 && projects.length > 0}
				<div class="empty-state">
					<Icon icon="mingcute:filter-2-line" class="size-12 mb-4 opacity-30" />
					<p>No projects match your filters.</p>
				</div>
			{:else if projects.length === 0}
				<div class="empty-state">
					<Icon icon="mingcute:music-2-line" class="size-12 mb-4 opacity-30" />
					<p>No public projects yet</p>
				</div>
			{:else}
				<div class="projects-grid">
					{#each paginatedProjects as project (project.id)}
						<ProjectCard
							project={project as any}
							daysAgo={daysAgo(project.updatedAt)}
							onOpenProject={handleOpenProject}
							onCloneProject={handleCloneProject}
						/>
					{/each}
				</div>
			{/if}

			{#if filteredProjects.length > itemsPerPage}
				<Box justify="center" gap="8px" class="mt-6">
					<Button
						onclick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						kind="outline"
						size="medium"
					>
						<Icon icon="mingcute:left-line" class="size-4" />
					</Button>
					<span class="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
					<Button
						onclick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage >= totalPages}
						kind="outline"
						size="medium"
					>
						<Icon icon="mingcute:right-line" class="size-4" />
					</Button>
				</Box>
			{/if}
		{/if}
	</main>
</div>

<style>
	.pageContainer {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.header-avatar {
		width: 96px;
		height: 96px;
		border-radius: 50%;
		background-color: var(--n-01);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		color: var(--n-05);
		flex-shrink: 0;
		border: 2px solid var(--n-03);
	}

	.header-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.pageTitle {
		font-size: 32px;
		font-weight: 700;
		margin: 0;
		color: var(--n-09);
	}

	.pageBio {
		font-size: 15px;
		color: var(--n-07);
		margin: 0;
		line-height: 1.5;
	}

	.pageJoined {
		font-size: 13px;
		color: var(--n-06);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.section-title {
		font-size: 20px;
		font-weight: 700;
		margin: 0;
		color: var(--n-09);
	}

	.section-subtitle {
		font-size: 14px;
		color: var(--n-06);
		margin: 4px 0 0 0;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 24px;
		margin-bottom: 32px;
	}

	.error-state,
	.empty-state {
		text-align: center;
		padding: 60px;
		color: var(--n-05);
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: var(--colorWhite);
		border-radius: 12px;
		border: 1px solid var(--n-03);
	}

	.error-state h2 {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: var(--n-09);
	}

	.error-state p {
		color: var(--n-06);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: var(--colorWhite);
		border-radius: 12px;
		border: 1px solid var(--n-03);
	}
</style>
