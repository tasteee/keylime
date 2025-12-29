<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import * as Avatar from '$lib/components/ui/avatar'
	import Icon from '@iconify/svelte'
	import dayjs from 'dayjs'
	import relativeTime from 'dayjs/plugin/relativeTime'
	import { goto } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'
	import { fade } from 'svelte/transition'
	import TopBar from '$lib/components/Dashboard/TopBar.svelte'
	import { createSupabaseClient } from '$lib/supabase/client'
	import { getPublicProjects } from '$lib/modules/database'
	import Badge from '$lib/components/ui/badge/badge.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import ProjectCard from '$lib/components/ProjectCard.svelte'
	import ProjectsBrowserBar from '$lib/components/ProjectsBrowserBar.svelte'
	import dashboardStore from '$lib/stores/dashboard.svelte'

	dayjs.extend(relativeTime)

	type ProjectResultT = ProjectT & {
		userName: string
		avatarUrl: string | null
	}

	dayjs.extend(relativeTime)

	let projects = $state<ProjectResultT[]>([])
	let isLoading = $state(false)
	let currentPage = $state(1)
	let totalCount = $state(0)
	let itemsPerPage = 20

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
		goto(`/project/${projectId}`)
	}

	const daysAgo = (date: Date) => {
		return dayjs(date).fromNow()
	}

	const handleFilterSubmit = (options: FilterOptionsT) => {
		loadPublicProjects(options, 1)
	}

	const handleCloneProject = async (projectId: string) => {
		const clonedProject = await dashboardStore.cloneProject(projectId)
		if (clonedProject) {
			goto(`/project/${clonedProject.id}`)
		}
	}

	$effect(() => {
		loadPublicProjects()
	})
</script>

<div class="pageContainer" in:fade>
	<TopBar />

	<main data-page-content-scrollable class="pageMainContent">
		<Box isColumn class="pageContentHeader">
			<h1 class="pageTitle">Discover Projects</h1>
			<p class="pageSubtitle">Explore projects from the community and what-not.</p>
		</Box>

		<ProjectsBrowserBar onsubmit={handleFilterSubmit} />

		{#if isLoading}
			<div class="loading-state" in:fade>
				<p>Loading projects...</p>
			</div>
		{:else if projects.length === 0}
			<div class="empty-state" in:fade>
				<Icon icon="mingcute:music-2-line" class="size-16 mb-4 opacity-30" />
				<p>No projects found</p>
			</div>
		{:else}
			<div class="projects-grid" in:fade>
				{#each projects as project (project.id)}
					<ProjectCard
						{project}
						daysAgo={daysAgo(project.updatedAt)}
						onOpenProject={handleOpenProject}
						onCloneProject={handleCloneProject}
					/>
				{/each}
			</div>
		{/if}

		{#if totalCount > itemsPerPage}
			<Box justify="center" gap="8px" class="mt-6">
				<Button
					onclick={() => loadPublicProjects(undefined, currentPage - 1)}
					disabled={currentPage === 1 || isLoading}
					kind="outline"
					size="medium"
				>
					<Icon icon="mingcute:left-line" class="size-4" />
				</Button>
				<span class="text-sm text-muted-foreground">
					Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
				</span>
				<Button
					onclick={() => loadPublicProjects(undefined, currentPage + 1)}
					disabled={currentPage >= Math.ceil(totalCount / itemsPerPage) || isLoading}
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
	.loading-state,
	.empty-state {
		text-align: center;
		padding: 60px;
		color: var(--n-05);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
