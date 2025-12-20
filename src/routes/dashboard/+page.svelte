<script lang="ts">
	import { goto } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'
	import projectsStore from '$lib/stores/projects.svelte'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { fade, fly } from 'svelte/transition'
	import { browser } from '$app/environment'
	import TopBar from '$lib/components/Dashboard/TopBar.svelte'

	type DashboardPropsT = {
		data: {
			isAuthenticated: boolean
			user: any
		}
	}

	const props: DashboardPropsT = $props()

	// Load projects when component mounts
	$effect(() => {
		if (browser && authStore.authUser) {
			projectsStore.loadProjects()
		}
	})

	const handleLogout = () => {
		authStore.signOut()
		goto('/')
	}

	const handleCreateProject = async () => {
		const newId = await projectsStore.createProject()
		goto(`/project/${newId}`)
	}

	const handleDeleteProject = (event: Event, id: string) => {
		event.stopPropagation()
		// TODO: Replace with confirmation modal.
		const shouldDelete = confirm('Are you sure you want to delete this project?')

		if (shouldDelete) {
			projectsStore.deleteProject(id)
		}
	}

	const handleOpenProject = (id: string) => {
		goto(`/project/${id}`)
	}

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(date)
	}
</script>

<div class="dashboard" in:fade>
	<TopBar />

	<main class="main-content">
		<div class="projects-header">
			<h1 class="page-title">My Projects</h1>
			<Button onclick={handleCreateProject}>
				<Icon icon="mingcute:add-line" class="mr-2 size-4" />
				New Project
			</Button>
		</div>

		<div class="projects-grid">
			{#each projectsStore.projects as project (project.id)}
				<div
					class="project-card"
					onclick={() => handleOpenProject(project.id)}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && handleOpenProject(project.id)}
					in:fly={{ y: 20, duration: 300 }}
				>
					<div class="card-content">
						<div class="card-header">
							<h3 class="project-title">{project.title}</h3>
							<button class="delete-btn" onclick={(e) => handleDeleteProject(e, project.id)} aria-label="Delete project">
								<Icon icon="mingcute:delete-2-line" class="size-4" />
							</button>
						</div>
						<p class="project-desc">{project.description || 'No description'}</p>
						<div class="card-footer">
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

		{#if projectsStore.projects.length === 0}
			<div class="empty-state">
				<p>No projects yet. Create one to get started!</p>
			</div>
		{/if}
	</main>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--n-00);
	}

	.main-content {
		flex: 1;
		padding: 40px;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	.projects-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 32px;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 32px;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.02em;
		color: var(--n-10);
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 24px;
	}

	.project-card {
		background: var(--colorWhite);
		border-radius: 8px;
		box-shadow: 0 2px 8px var(--n-alpha-1);
		transition: all 0.2s ease;
		cursor: pointer;
		border: 1px solid var(--n-03);
		overflow: hidden;
		position: relative;
	}

	.project-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px var(--n-alpha-2);
		border-color: var(--n-04);
	}

	.card-content {
		padding: 20px;
		display: flex;
		flex-direction: column;
		height: 100%;
		box-sizing: border-box;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 8px;
	}

	.project-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
		color: var(--n-09);
	}

	.delete-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--n-05);
		padding: 4px;
		border-radius: 5px;
		transition:
			color 0.2s,
			background-color 0.2s;
		opacity: 0;
	}

	.project-card:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		color: var(--d-06);
		background-color: var(--d-01);
	}

	.project-desc {
		font-size: 14px;
		color: var(--n-06);
		margin: 0 0 20px 0;
		flex: 1;
		line-height: 1.4;
	}

	.card-footer {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 12px;
		color: var(--n-05);
		border-top: 1px solid var(--n-02);
		padding-top: 16px;
	}

	.meta-tag {
		display: flex;
		align-items: center;
		background-color: var(--n-01);
		padding: 4px 8px;
		border-radius: 5px;
		font-weight: 500;
		color: var(--n-08);
	}

	.date {
		margin-left: auto;
	}

	.empty-state {
		text-align: center;
		padding: 60px;
		color: var(--n-05);
	}
</style>
