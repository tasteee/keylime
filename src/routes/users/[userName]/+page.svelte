<script lang="ts">
	import { UserCircle, Clock, MusicNotes, FunnelSimple } from 'phosphor-svelte'
	import { goToPath } from '$lib/modules/navigate'
	import { useActiveUser } from '$lib/helpers/useActiveUser.svelte'
	import PageLayout from '$lib/components/PageLayout.svelte'
	import { cloneProjectById } from '$lib/modules/database'
	import ProjectCard from '$lib/components/ProjectCard.svelte'
	import ProjectsBrowserBar from '$lib/components/ProjectsBrowserBar.svelte'
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
	const activeUser = useActiveUser()

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
		goToPath(`/project/${projectId}`)
	}

	const handleGoBack = () => {
		goToPath('/users')
	}

	const formatDate = (date: Date) => {
		return dayjs(date).format('MMMM D, YYYY')
	}

	const daysAgo = (date: Date) => {
		return dayjs(date).fromNow()
	}

	const handleCloneProject = async (projectId: string) => {
		if (!activeUser) return
		const result = await cloneProjectById(projectId, activeUser.id)
		if (result.data) {
			goToPath(`/project/${result.data.id}`)
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

	const handlePaginationChange = (event: CustomEvent) => {
		handlePageChange(event.detail.page)
	}

	const hasMultiplePages = $derived(filteredProjects.length > itemsPerPage)
	const hasNoMatchingProjects = $derived(paginatedProjects.length === 0 && projects.length > 0)
	const hasNoProjects = $derived(projects.length === 0)
	const projectCountLabel = $derived(filteredProjects.length === 1 ? 'project' : 'projects')
	const isFiltered = $derived(filteredProjects.length !== projects.length)

	const isOwnProfile = $derived.by(() => {
		return activeUser?.userName === userProfile?.userName
	})
</script>

<PageLayout>
	{#if !userProfile}
		<z-empty-state heading="User not found" description="The user could not be found." isBordered>
			<z-box slot="icon" isInline><UserCircle size={32} /></z-box>
			<z-button tone="primary" onclick={handleGoBack}>Back to users</z-button>
		</z-empty-state>
	{:else}
		<z-row gap="lg" alignsY="center">
			<z-avatar name={userProfile.userName} src={userProfile.avatarUrl ?? undefined} size="xl"></z-avatar>
			<z-column gap="xs">
				<z-heading size="sm">@{userProfile.userName}</z-heading>
				<z-text color="muted">{userProfile.bio || 'No bio yet'}</z-text>
				<z-row gap="xs" alignsY="center">
					<Clock size={14} />
					<z-text size="sm" color="muted">Joined {formatDate(userProfile.createdAt)}</z-text>
				</z-row>
			</z-column>
		</z-row>

		<ProjectsBrowserBar onsubmit={handleFilterSubmit} />

		<z-column gap="2xs">
			<z-subheading size="xl">Public projects</z-subheading>
			<z-text size="sm" color="muted">
				{filteredProjects.length}
				{projectCountLabel}
				{#if isFiltered}
					(filtered from {projects.length} total)
				{/if}
			</z-text>
		</z-column>

		{#if hasNoMatchingProjects}
			<z-empty-state heading="No matches" description="No projects match your filters." isBordered>
				<z-box slot="icon" isInline><FunnelSimple size={32} /></z-box>
			</z-empty-state>
		{:else if hasNoProjects}
			<z-empty-state heading="No public projects yet" description="Nothing to show here." isBordered>
				<z-box slot="icon" isInline><MusicNotes size={32} /></z-box>
			</z-empty-state>
		{:else}
			<z-grid minColumnWidth="20rem" gap="md">
				{#each paginatedProjects as project (project.id)}
					<ProjectCard
						project={project as any}
						daysAgo={daysAgo(project.updatedAt)}
						onOpenProject={handleOpenProject}
						onCloneProject={handleCloneProject}
					/>
				{/each}
			</z-grid>
		{/if}

		{#if hasMultiplePages}
			<z-row alignsX="center">
				<z-pagination page={currentPage} total={totalPages} onchange={handlePaginationChange}></z-pagination>
			</z-row>
		{/if}
	{/if}
</PageLayout>
