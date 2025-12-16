<script lang="ts">
	import { goto } from '$app/navigation'
	import authStore from '$lib/stores/auth.svelte'
	import projectsStore from '$lib/stores/projects.svelte'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { fade, fly } from 'svelte/transition'

	// Fake Auth Check
	$effect(() => {
		if (!authStore.isAuthenticated) {
			// For demo purposes, we can auto-login or show a login screen.
			// Let's show a simple login screen if not authed.
		}
	})

	const handleLogin = () => {
		authStore.login()
	}

	const handleLogout = () => {
		authStore.logout()
	}

	const handleCreateProject = () => {
		const newId = projectsStore.createProject()
		goto(`/project/${newId}`)
	}

	const handleDeleteProject = (e: Event, id: string) => {
		e.stopPropagation()
		if (confirm('Are you sure you want to delete this project?')) {
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

<div class="dashboard-container">
	{#if !authStore.isAuthenticated}
		<div class="login-screen" in:fade>
			<div class="login-card">
				<div class="logo">
					<span class="logo-text">KEYLIME</span>
				</div>
				<p class="login-subtitle">Sign in to continue to your dashboard.</p>
				<Button onclick={handleLogin} class="w-full">Sign In with Fake Auth</Button>
			</div>
		</div>
	{:else}
		<div class="dashboard" in:fade>
			<header class="header">
				<div class="logo">
					<span class="logo-text">KEYLIME</span>
				</div>
				<div class="user-menu">
					<span class="user-name">{authStore.user?.name}</span>
					<Button variant="ghost" size="sm" onclick={handleLogout}>Sign Out</Button>
				</div>
			</header>

			<main class="main-content">
				<div class="projects-header">
					<h1 class="page-title">Projects</h1>
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
									<button
										class="delete-btn"
										onclick={(e) => handleDeleteProject(e, project.id)}
										aria-label="Delete project"
									>
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
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		background-color: #f5f5f7; /* Apple-like light gray background */
		color: #1d1d1f;
	}

	.dashboard-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.login-screen {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background-color: #fff;
	}

	.login-card {
		width: 100%;
		max-width: 360px;
		padding: 40px;
		text-align: center;
	}

	.login-subtitle {
		margin-bottom: 24px;
		color: #86868b;
	}

	.dashboard {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
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

	.logo-text {
		font-weight: 700;
		font-size: 18px;
		letter-spacing: -0.5px;
	}

	.user-menu {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.user-name {
		font-size: 14px;
		font-weight: 500;
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
		font-size: 32px;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.02em;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 24px;
	}

	.project-card {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		transition: all 0.2s ease;
		cursor: pointer;
		border: 1px solid rgba(0, 0, 0, 0.05);
		overflow: hidden;
		position: relative;
	}

	.project-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
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
		color: #1d1d1f;
	}

	.delete-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: #86868b;
		padding: 4px;
		border-radius: 4px;
		transition:
			color 0.2s,
			background-color 0.2s;
		opacity: 0;
	}

	.project-card:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		color: #ff3b30;
		background-color: rgba(255, 59, 48, 0.1);
	}

	.project-desc {
		font-size: 14px;
		color: #86868b;
		margin: 0 0 20px 0;
		flex: 1;
		line-height: 1.4;
	}

	.card-footer {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 12px;
		color: #86868b;
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		padding-top: 16px;
	}

	.meta-tag {
		display: flex;
		align-items: center;
		background-color: #f5f5f7;
		padding: 4px 8px;
		border-radius: 4px;
		font-weight: 500;
	}

	.date {
		margin-left: auto;
	}

	.empty-state {
		text-align: center;
		padding: 60px;
		color: #86868b;
	}
</style>
