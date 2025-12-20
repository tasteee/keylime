<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import Icon from '@iconify/svelte'
	import { goto } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'
	import { fade } from 'svelte/transition'
	import TopBar from '$lib/components/Dashboard/TopBar.svelte'

	type PublicProjectT = {
		id: string
		title: string
		description: string
		key: string
		scale: string
		bpm: number
		userName: string
		userAvatarUrl: string | null
		updatedAt: Date
	}

	let projects = $state<PublicProjectT[]>([])
	let searchQuery = $state('')
	let isLoading = $state(false)

	// Load public projects
	$effect(() => {
		isLoading = true
		// TODO: Implement actual API call to load published projects
		setTimeout(() => {
			projects = []
			isLoading = false
		}, 500)
	})

	const filteredProjects = $derived.by(() => {
		const query = searchQuery.toLowerCase()
		if (!query) return projects
		return projects.filter((project) => {
			const matchesTitle = project.title.toLowerCase().includes(query)
			const matchesDescription = project.description.toLowerCase().includes(query)
			const matchesUserName = project.userName.toLowerCase().includes(query)
			return matchesTitle || matchesDescription || matchesUserName
		})
	})

	const handleOpenProject = (projectId: string) => {
		goto(`/project/${projectId}`)
	}

	const handleUserClick = (event: Event, userName: string) => {
		event.stopPropagation()
		goto(`/users/${userName}`)
	}

	const handleGoBack = () => {
		goto('/dashboard')
	}

	const handleLogout = () => {
		authStore.signOut()
		goto('/')
	}

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(date)
	}
</script>

<div class="page-container" in:fade>
	<TopBar />

	<main class="main-content">
		<div class="content-header">
			<h1 class="page-title">Discover Projects</h1>
			<p class="page-subtitle">Explore chord progressions from the community</p>
		</div>

		<div class="search-bar">
			<Icon icon="mingcute:search-line" class="search-icon" />
			<Input type="text" bind:value={searchQuery} placeholder="Search projects..." class="search-input" />
		</div>

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
					<div
						class="project-card"
						onclick={() => handleOpenProject(project.id)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && handleOpenProject(project.id)}
					>
						<div class="card-content">
							<h3 class="project-title">{project.title}</h3>
							<p class="project-desc">{project.description || 'No description'}</p>
							<div class="card-footer">
								<button class="user-badge" onclick={(e) => handleUserClick(e, project.userName)}>
									<div class="user-avatar-small">
										{#if project.userAvatarUrl}
											<img src={project.userAvatarUrl} alt={project.userName} />
										{:else}
											<Icon icon="mingcute:user-3-line" class="size-3" />
										{/if}
									</div>
									<span class="user-name-small">{project.userName}</span>
								</button>
								<div class="meta-tag">
									<Icon icon="mingcute:music-line" class="size-3 mr-1" />
									{project.key}
									{project.scale}
								</div>
								<div class="meta-tag">
									<Icon icon="mingcute:time-line" class="size-3 mr-1" />
									{project.bpm} BPM
								</div>
								<span class="date">{formatDate(project.updatedAt)}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.page-container {
		min-height: 100vh;
		background-color: #f5f5f7;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 40px;
		height: 64px;
		background-color: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.logo-text {
		font-weight: 700;
		font-size: 18px;
		letter-spacing: -0.5px;
		color: #1d1d1f;
	}

	.user-menu {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.user-name {
		font-size: 14px;
		font-weight: 500;
		color: #1d1d1f;
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 40px;
	}

	.content-header {
		margin-bottom: 32px;
	}

	.page-title {
		font-size: 32px;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: #1d1d1f;
	}

	.page-subtitle {
		font-size: 16px;
		color: #86868b;
		margin: 0;
	}

	.search-bar {
		position: relative;
		margin-bottom: 32px;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: #86868b;
		font-size: 20px;
		pointer-events: none;
	}

	:global(.search-input) {
		padding-left: 40px !important;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 24px;
	}

	.project-card {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		transition: all 0.2s ease;
		cursor: pointer;
		border: 1px solid rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.project-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
	}

	.card-content {
		padding: 20px;
	}

	.project-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 8px 0;
		color: #1d1d1f;
	}

	.project-desc {
		font-size: 14px;
		color: #86868b;
		margin: 0 0 20px 0;
		line-height: 1.4;
	}

	.card-footer {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #86868b;
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		padding-top: 16px;
		flex-wrap: wrap;
	}

	.user-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		border-radius: 5px;
		background-color: #f5f5f7;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.user-badge:hover {
		background-color: #e5e5e7;
	}

	.user-avatar-small {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		color: #86868b;
	}

	.user-avatar-small img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.user-name-small {
		font-size: 12px;
		font-weight: 500;
		color: #1d1d1f;
	}

	.meta-tag {
		display: flex;
		align-items: center;
		background-color: #f5f5f7;
		padding: 4px 8px;
		border-radius: 5px;
		font-weight: 500;
		color: #1d1d1f;
	}

	.date {
		margin-left: auto;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 60px;
		color: #86868b;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
