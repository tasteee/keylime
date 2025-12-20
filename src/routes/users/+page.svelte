<script lang="ts">
	import { Input } from '$lib/components/ui/input'
	import Icon from '@iconify/svelte'
	import { goto } from '$app/navigation'
	import { fade } from 'svelte/transition'
	import TopBar from '$lib/components/Dashboard/TopBar.svelte'

	let users = $state<UserT[]>([])
	let searchQuery = $state('')
	let isLoading = $state(false)

	// Mock data for now - replace with actual API call
	$effect(() => {
		// Load users from API
		isLoading = true
		// TODO: Implement actual user loading
		setTimeout(() => {
			users = []
			isLoading = false
		}, 500)
	})

	const filteredUsers = $derived.by(() => {
		const query = searchQuery.toLowerCase()
		if (!query) return users
		return users.filter((user) => {
			const matchesUserName = user.userName.toLowerCase().includes(query)
			const matchesBio = user.bio.toLowerCase().includes(query)
			return matchesUserName || matchesBio
		})
	})

	const handleUserClick = (userName: string) => {
		goto(`/users/${userName}`)
	}
</script>

<div class="page-container" in:fade>
	<TopBar />

	<main class="main-content">
		<div class="search-bar">
			<Icon icon="mingcute:search-line" class="search-icon" />
			<Input type="text" bind:value={searchQuery} placeholder="Search users..." class="search-input" />
		</div>

		{#if isLoading}
			<div class="loading-state">
				<p>Loading users...</p>
			</div>
		{:else if filteredUsers.length === 0}
			<div class="empty-state">
				<Icon icon="mingcute:group-line" class="size-16 mb-4 opacity-30" />
				<p>No users found</p>
			</div>
		{:else}
			<div class="users-grid">
				{#each filteredUsers as user (user.id)}
					<div
						class="user-card"
						onclick={() => handleUserClick(user.userName)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && handleUserClick(user.userName)}
					>
						<div class="user-avatar">
							{#if user.avatarUrl}
								<img src={user.avatarUrl} alt={user.userName} />
							{:else}
								<Icon icon="mingcute:user-3-line" class="size-12" />
							{/if}
						</div>
						<h3 class="user-name-display">{user.userName}</h3>
						<p class="user-bio">{user.bio || 'No bio yet'}</p>
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
	.main-content {x;
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

	.users-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 24px;
	}

	.user-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		text-align: center;
		cursor: pointer;
		border: 1px solid rgba(0, 0, 0, 0.05);
		transition: all 0.2s ease;
	}

	.user-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
	}

	.user-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		margin: 0 auto 16px;
		background-color: #f5f5f7;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		color: #86868b;
	}

	.user-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.user-name-display {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 8px 0;
		color: #1d1d1f;
	}

	.user-bio {
		font-size: 14px;
		color: #86868b;
		margin: 0;
		line-height: 1.4;
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
