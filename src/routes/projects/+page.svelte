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

	dayjs.extend(relativeTime)

	type ProjectResultT = ProjectT & {
		userName: string
		avatarUrl: string | null
	}

	dayjs.extend(relativeTime)

	let projects = $state<ProjectResultT[]>([])
	let isLoading = $state(false)

	type FilterOptionsT = {
		searchText: string
		key: string | null
		scale: string | null
		bpmMin: number | null
		bpmMax: number | null
		chordSymbols: string[]
	}

	const loadPublicProjects = async (filterOptions?: FilterOptionsT) => {
		isLoading = true

		const queryOptions = {
			searchQuery: filterOptions?.searchText || undefined,
			key: filterOptions?.key || undefined,
			scale: filterOptions?.scale || undefined,
			minBpm: filterOptions?.bpmMin || undefined,
			maxBpm: filterOptions?.bpmMax || undefined,
			chordSymbols: filterOptions?.chordSymbols?.length ? filterOptions.chordSymbols : undefined
		}

		const { data, error } = await getPublicProjects(queryOptions)
		const projectResults = (data || []) as ProjectResultT[]

		if (error) {
			console.error('Error loading public projects:', error)
			projects = []
			isLoading = false
			return
		}

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

	const handleFilterSubmit = (options: {
		searchText: string
		key: string | null
		scale: string | null
		bpmMin: number | null
		bpmMax: number | null
		chordSymbols: string[]
	}) => {
		loadPublicProjects(options)
	}

	$effect(() => {
		loadPublicProjects()
	})
</script>

<div class="pageContainer" in:fade>
	<TopBar />

	<main class="pageMainContent">
		<Box isColumn class="pageContentHeader">
			<h1 class="pageTitle">Discover Projects</h1>
			<p class="pageSubtitle">Explore chord progressions from the community</p>
		</Box>

		<ProjectsBrowserBar onsubmit={handleFilterSubmit} />

		{#if isLoading}
			<div class="loading-state">
				<p>Loading projects...</p>
			</div>
		{:else if projects.length === 0}
			<div class="empty-state">
				<Icon icon="mingcute:music-2-line" class="size-16 mb-4 opacity-30" />
				<p>No projects found</p>
			</div>
		{:else}
			<div class="projects-grid">
				{#each projects as project (project.id)}
					<ProjectCard {project} daysAgo={daysAgo(project.updatedAt)} onOpenProject={handleOpenProject} />
				{/each}
			</div>
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
