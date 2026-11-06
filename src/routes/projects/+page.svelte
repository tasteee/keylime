<script lang="ts">
	import { MusicNotes } from 'phosphor-svelte'
	import { daysAgo } from '$lib/modules/dateTime'
	import { goToPath } from '$lib/modules/navigate'
	import { getPublicProjects, cloneProjectById } from '$lib/modules/database'
	import PageLayout from '$lib/components/PageLayout.svelte'
	import PageHeader from '$lib/components/PageHeader.svelte'
	import ProjectCard from '$lib/components/ProjectCard.svelte'
	import ProjectsBrowserBar from '$lib/components/ProjectsBrowserBar.svelte'
	import { useActiveUser } from '$lib/helpers/useActiveUser.svelte'

	type ProjectResultT = ProjectT & {
		userName: string
		avatarUrl: string | null
	}

	type PropsT = {
		data: {
			projects: ProjectResultT[]
		}
	}

	const props: PropsT = $props()
	const activeUser = useActiveUser()

	let projects = $state<ProjectResultT[]>(props.data.projects)
	let isLoading = $state(false)
	let currentPage = $state(1)
	let totalCount = $state(props.data.projects.length)
	let currentFilterOptions = $state<FilterOptionsT | undefined>(undefined)

	const itemsPerPage = 20

	type FilterOptionsT = {
		searchText: string
		key: string | null
		scale: string | null
		bpmMin: number | null
		bpmMax: number | null
		chordSymbols: string[]
		chordMatchMode: 'all' | 'any'
	}

	const loadPublicProjects = async (filterOptions?: FilterOptionsT, page: number = 1) => {
		isLoading = true
		currentPage = page
		currentFilterOptions = filterOptions

		const offsetValue = (page - 1) * itemsPerPage

		const queryOptions = {
			searchQuery: filterOptions?.searchText || undefined,
			key: filterOptions?.key || undefined,
			scale: filterOptions?.scale || undefined,
			minBpm: filterOptions?.bpmMin || undefined,
			maxBpm: filterOptions?.bpmMax || undefined,
			chordSymbols: filterOptions?.chordSymbols?.length ? filterOptions.chordSymbols : undefined,
			chordMatchMode: filterOptions?.chordMatchMode || 'any',
			limit: itemsPerPage,
			offset: offsetValue
		}

		const { data, error, totalCount: count } = await getPublicProjects(queryOptions)
		const projectResults = (data || []) as ProjectResultT[]

		if (error) {
			console.error('Error loading public projects:', error)
			projects = []
			isLoading = false
			return
		}

		console.log('Loaded projects sample:', projectResults[0])

		totalCount = count || 0
		projects = projectResults.map((project) => {
			return {
				...project,
				userName: project.userName,
				avatarUrl: project.avatarUrl,
				updatedAt: new Date(project.updatedAt),
				createdAt: new Date(project.createdAt)
			}
		})

		isLoading = false
	}

	const handleOpenProject = (projectId: string) => {
		goToPath(`/project/${projectId}`)
	}

	const handleFilterSubmit = (options: FilterOptionsT) => {
		loadPublicProjects(options, 1)
	}

	const handleCloneProject = async (projectId: string) => {
		if (!activeUser) return
		const result = await cloneProjectById(projectId, activeUser.id)
		if (result.data) {
			goToPath(`/project/${result.data.id}`)
		}
	}

	const handlePaginationChange = (event: CustomEvent) => {
		const nextPage: number = event.detail.page
		loadPublicProjects(currentFilterOptions, nextPage)
	}

	const totalPages = $derived(Math.ceil(totalCount / itemsPerPage))
	const hasMultiplePages = $derived(totalCount > itemsPerPage)
	const hasNoProjects = $derived(projects.length === 0)
</script>

<PageLayout>
	<PageHeader title="Discover projects" subtitle="Explore projects from the community and what-not." />

	<ProjectsBrowserBar onsubmit={handleFilterSubmit} />

	{#if isLoading}
		<z-grid minColumnWidth="20rem" gap="md">
			{#each Array.from({ length: 6 }) as _}
				<z-skeleton shape="rect" height="16rem"></z-skeleton>
			{/each}
		</z-grid>
	{:else if hasNoProjects}
		<z-empty-state heading="No projects found" description="Try a different search or loosen your filters." isBordered>
			<z-box slot="icon" isInline><MusicNotes size={32} /></z-box>
		</z-empty-state>
	{:else}
		<z-grid minColumnWidth="20rem" gap="md">
			{#each projects as project (project.id)}
				<ProjectCard
					{project}
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
</PageLayout>
