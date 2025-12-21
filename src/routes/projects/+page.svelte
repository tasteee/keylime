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

	type ProjectUserT = {
		userName: string
		avatarUrl: string | null
	}

	type ProjectResultT = ProjectT & {
		user: ProjectUserT
		userName: string
		userAvatarUrl: string | null
	}

	dayjs.extend(relativeTime)

	let projects = $state<ProjectResultT[]>([])
	let activeFilters = $state({
		searchText: '',
		key: null as string | null,
		scale: null as string | null,
		bpmMin: null as number | null,
		bpmMax: null as number | null,
		chordSymbols: [] as string[]
	})
	let isLoading = $state(false)

	const loadPublicProjects = async () => {
		isLoading = true
		const { data, error } = await getPublicProjects({})
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
				userName: project.user.userName,
				userAvatarUrl: project.user.avatarUrl,
				updatedAt: new Date(project.updatedAt),
				createdAt: new Date(project.createdAt)
			}
		})

		isLoading = false
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
				const matchesUserName = project.userName.toLowerCase().includes(query)
				return matchesTitle || matchesDescription || matchesUserName
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

		// Filter by chord symbols (must include ALL specified chords)
		const hasChordSymbolsFilter = activeFilters.chordSymbols.length > 0
		if (hasChordSymbolsFilter) {
			results = results.filter((project) => {
				const projectChords = project.chordSymbols || []
				const hasAllChords = activeFilters.chordSymbols.every((filterChord) => {
					return projectChords.includes(filterChord)
				})
				return hasAllChords
			})
		}

		return results
	})

	const handleOpenProject = (projectId: string) => {
		goto(`/project/${projectId}`)
	}

	const handleUserClick = (event: Event, userName: string) => {
		event.stopPropagation()
		goto(`/users/${userName}`)
	}

	const daysAgo = (date: Date) => {
		return dayjs(date).fromNow()
	}

	const handleFilterSubmit = (options: typeof activeFilters) => {
		activeFilters = options
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
		{:else if filteredProjects.length === 0}
			<div class="empty-state">
				<Icon icon="mingcute:music-2-line" class="size-16 mb-4 opacity-30" />
				<p>No projects found</p>
			</div>
		{:else}
			<div class="projects-grid">
				{#each filteredProjects as project (project.id)}
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
