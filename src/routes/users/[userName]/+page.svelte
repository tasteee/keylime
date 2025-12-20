<script lang="ts">
	import { page } from '$app/stores'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { goto } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'
	import { fade } from 'svelte/transition'
	import TopBar from '$lib/components/Dashboard/TopBar.svelte'

	type UserProfilePagePropsT = {
		data: {
			userName: string
		}
	}

	const props: UserProfilePagePropsT = $props()

	type UserProfileT = {
		id: string
		userName: string
		avatarUrl: string | null
		bio: string
		createdAt: Date
	}

	type ProjectT = {
		id: string
		title: string
		description: string
		key: string
		scale: string
		bpm: number
		isPublished: boolean
		updatedAt: Date
	}

	let userProfile = $state<UserProfileT | null>(null)
	let projects = $state<ProjectT[]>([])
	let isLoading = $state(true)
	let isFollowing = $state(false)

	// Load user profile and their published projects
	$effect(() => {
		const userName = $page.params.userName
		// TODO: Implement actual API calls
		isLoading = true
		setTimeout(() => {
			// Mock data
			userProfile = null
			projects = []
			isLoading = false
		}, 500)
	})

	const handleFollowToggle = () => {
		isFollowing = !isFollowing
		// TODO: Implement follow/unfollow API call
	}

	const handleOpenProject = (projectId: string) => {
		goto(`/project/${projectId}`)
	}

	const handleGoBack = () => {
		goto('/users')
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

	const isOwnProfile = $derived.by(() => {
		return authStore.userProfile?.userName === props.data.userName
	})
</script>

<div class="page-container" in:fade>
	<TopBar />

	<main class="main-content">
		{#if isLoading}
			<div class="loading-state">
				<p>Loading profile...</p>
			</div>
		{:else if !userProfile}
			<div class="error-state">
				<Icon icon="mingcute:user-3-line" class="size-16 mb-4 opacity-30" />
				<h2>User Not Found</h2>
				<p>The user @{props.data.userName} could not be found.</p>
				<Button onclick={handleGoBack} class="mt-4">Back to Users</Button>
			</div>
		{:else}
			<div class="profile-header">
				<div class="profile-avatar">
					{#if userProfile.avatarUrl}
						<img src={userProfile.avatarUrl} alt={userProfile.userName} />
					{:else}
						<Icon icon="mingcute:user-3-line" class="size-16" />
					{/if}
				</div>
				<div class="profile-info">
					<h1 class="profile-name">{userProfile.userName}</h1>
					<p class="profile-bio">{userProfile.bio || 'No bio yet'}</p>
					<p class="profile-joined">Joined {formatDate(userProfile.createdAt)}</p>
				</div>
				{#if !isOwnProfile}
					<div class="profile-actions">
						<Button onclick={handleFollowToggle}>
							{#if isFollowing}
								<Icon icon="mingcute:check-line" class="mr-2 size-4" />
								Following
							{:else}
								<Icon icon="mingcute:add-line" class="mr-2 size-4" />
								Follow
							{/if}
						</Button>
					</div>
				{/if}
			</div>

			<div class="projects-section">
				<h2 class="section-title">Published Projects</h2>

				{#if projects.length === 0}
					<div class="empty-state">
						<Icon icon="mingcute:music-2-line" class="size-12 mb-4 opacity-30" />
						<p>No published projects yet</p>
					</div>
				{:else}
					<div class="projects-grid">
						{#each projects as project (project.id)}
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

	.profile-header {
		background: white;
		border-radius: 12px;
		padding: 32px;
		margin-bottom: 40px;
		display: flex;
		align-items: flex-start;
		gap: 24px;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.profile-avatar {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background-color: #f5f5f7;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		color: #86868b;
		flex-shrink: 0;
	}

	.profile-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.profile-info {
		flex: 1;
	}

	.profile-name {
		font-size: 28px;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: #1d1d1f;
	}

	.profile-bio {
		font-size: 16px;
		color: #1d1d1f;
		margin: 0 0 8px 0;
		line-height: 1.5;
	}

	.profile-joined {
		font-size: 14px;
		color: #86868b;
		margin: 0;
	}

	.profile-actions {
		display: flex;
		gap: 12px;
	}

	.section-title {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 24px 0;
		color: #1d1d1f;
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
		border-radius: 5px;
		font-weight: 500;
		color: #1d1d1f;
	}

	.date {
		margin-left: auto;
	}

	.loading-state,
	.error-state,
	.empty-state {
		text-align: center;
		padding: 60px;
		color: #86868b;
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: white;
		border-radius: 12px;
	}

	.error-state h2 {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: #1d1d1f;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: white;
		border-radius: 12px;
	}
</style>
