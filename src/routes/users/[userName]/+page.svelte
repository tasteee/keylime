<script lang="ts">
	import { page } from '$app/stores'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { goto } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.svelte'
	import { fade } from 'svelte/transition'
	import TopBar from '$lib/components/Dashboard/TopBar.svelte'
	import { getUserByUserName, getPublicProjectsByUserName } from '$lib/modules/database'
	import ProjectCard from '$lib/components/ProjectCard.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import dayjs from 'dayjs'
	import relativeTime from 'dayjs/plugin/relativeTime'
	import dashboardStore from '$lib/stores/dashboard.svelte'

	dayjs.extend(relativeTime)

	type UserProfilePagePropsT = {
		data: {
			userName: string
		}
	}

	const props: UserProfilePagePropsT = $props()

	type ProjectResultT = ProjectT & {
		userName: string
		avatarUrl: string | null
	}

	let userProfile = $state<UserT | null>(null)
	let projects = $state<ProjectResultT[]>([])
	let isLoading = $state(true)

	const loadUserProfile = async () => {
		isLoading = true
		const userName = $page.params.userName

		const userResult = await getUserByUserName(userName)
		const projectsResult = await getPublicProjectsByUserName(userName)

		if (userResult.error || !userResult.data) {
			console.error('Error loading user profile:', userResult.error)
			userProfile = null
			projects = []
			isLoading = false
			return
		}

		userProfile = {
			...userResult.data,
			updatedAt: new Date(userResult.data.updatedAt),
			createdAt: new Date(userResult.data.createdAt)
		}

		const projectResults = (projectsResult.data || []) as ProjectResultT[]
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

	const handleGoBack = () => {
		goto('/users')
	}

	const formatDate = (date: Date) => {
		return dayjs(date).format('MMMM D, YYYY')
	}

	const daysAgo = (date: Date) => {
		return dayjs(date).fromNow()
	}

	const isOwnProfile = $derived.by(() => {
		return authStore.userProfile?.userName === props.data.userName
	})

	const handleCloneProject = async (projectId: string) => {
		const clonedProject = await dashboardStore.cloneProject(projectId)
		if (clonedProject) {
			goto(`/project/${clonedProject.id}`)
		}
	}

	$effect(() => {
		loadUserProfile()
	})
</script>

<div class="pageContainer" in:fade>
	<TopBar />

	<main class="pageMainContent">
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
					<h1 class="profile-name">@{userProfile.userName}</h1>
					<p class="profile-bio">{userProfile.bio || 'No bio yet'}</p>
					<p class="profile-joined">
						<Icon icon="mingcute:time-line" class="inline-icon" />
						Joined {formatDate(userProfile.createdAt)}
					</p>
				</div>
			</div>

			<div class="projects-section">
				<Box isColumn class="section-header">
					<h2 class="section-title">Public Projects</h2>
					<p class="section-subtitle">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</p>
				</Box>

				{#if projects.length === 0}
					<div class="empty-state">
						<Icon icon="mingcute:music-2-line" class="size-12 mb-4 opacity-30" />
						<p>No public projects yet</p>
					</div>
				{:else}
					<div class="projects-grid">
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
			</div>
		{/if}
	</main>
</div>

<style>
	.profile-header {
		background: var(--colorWhite);
		border-radius: 12px;
		padding: 40px;
		margin-bottom: 40px;
		display: flex;
		align-items: flex-start;
		gap: 32px;
		border: 1px solid var(--n-03);
		box-shadow: 0 2px 8px var(--n-alpha-1);
	}

	.profile-avatar {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background-color: var(--n-01);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		color: var(--n-05);
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
		font-size: 32px;
		font-weight: 700;
		margin: 0 0 12px 0;
		color: var(--n-09);
	}

	.profile-bio {
		font-size: 16px;
		color: var(--n-07);
		margin: 0 0 12px 0;
		line-height: 1.6;
	}

	.profile-joined {
		font-size: 14px;
		color: var(--n-06);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.inline-icon {
		font-size: 16px;
	}

	.section-header {
		margin-bottom: 24px;
	}

	.section-title {
		font-size: 24px;
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
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 24px;
		margin-top: 24px;
	}

	.loading-state,
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
