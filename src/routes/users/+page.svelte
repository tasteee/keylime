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
		background-color: var(--n-00);
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
		font-family: var(--font-display);
		font-size: 32px;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: var(--n-10);
	}

	.page-subtitle {
		font-size: 16px;
		color: var(--n-06);
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
		color: var(--n-05);
		font-size: 20px;
		pointer-events: none;
		z-index: 1;
	}

	:global(.search-input) {
		padding-left: 40px !important;
		background-color: var(--colorWhite);
		border-color: var(--n-03);
	}

	.users-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 24px;
	}

	.user-card {
		background: var(--colorWhite);
		border-radius: 12px;
		padding: 24px;
		text-align: center;
		cursor: pointer;
		border: 1px solid var(--n-03);
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px var(--n-alpha-1);
	}

	.user-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 16px var(--n-alpha-2);
		border-color: var(--n-04);
	}

	.user-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		margin: 0 auto 16px;
		background-color: var(--n-01);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		color: var(--n-05);
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
		color: var(--n-09);
	}

	.user-bio {
		font-size: 14px;
		color: var(--n-06);
		margin: 0;
		line-height: 1.4;
	}

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
