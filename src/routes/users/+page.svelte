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
	import { getPublicUsers } from '$lib/modules/database'
	import Badge from '$lib/components/ui/badge/badge.svelte'
	import Box from '$lib/components/ui/box.svelte'

	dayjs.extend(relativeTime)

	let users = $state<UserT[]>([])
	let isLoading = $state(false)
	let searchText = $state('')

	type FilterOptionsT = {
		searchText: string
	}

	const loadPublicUsers = async (filterOptions?: FilterOptionsT) => {
		isLoading = true

		const queryOptions = {
			searchQuery: filterOptions?.searchText || undefined
		}

		const { data, error } = await getPublicUsers(queryOptions)
		const userResults = (data || []) as UserT[]

		if (error) {
			console.error('Error loading public users:', error)
			users = []
			isLoading = false
			return
		}

		users = userResults.map((user) => {
			return {
				...user,
				updatedAt: new Date(user.updatedAt),
				createdAt: new Date(user.createdAt)
			}
		})

		isLoading = false
	}

	const handleUserClick = (userName: string) => {
		goto(`/users/${userName}`)
	}

	const daysAgo = (date: Date) => {
		return dayjs(date).fromNow()
	}

	const handleSearch = (event: Event) => {
		const target = event.target as HTMLInputElement
		searchText = target.value
		loadPublicUsers({ searchText })
	}

	$effect(() => {
		loadPublicUsers()
	})
</script>

<div class="pageContainer" in:fade>
	<TopBar />

	<main data-page-content-scrollable class="pageMainContent">
		<Box isColumn class="pageContentHeader">
			<h1 class="pageTitle">Discover Creators</h1>
			<p class="pageSubtitle">Explore musicians and their chord progressions</p>
		</Box>

		<div class="search-bar">
			<Input size="large" type="text" value={searchText} oninput={handleSearch} placeholder="Search users...">
				{#snippet startIcon()}
					<Icon icon="mingcute:search-line" />
				{/snippet}
			</Input>
		</div>

		{#if isLoading}
			<div class="loading-state">
				<p>Loading users...</p>
			</div>
		{:else if users.length === 0}
			<div class="empty-state">
				<Icon icon="mingcute:group-line" class="size-16 mb-4 opacity-30" />
				<p>No users found</p>
			</div>
		{:else}
			<div class="users-grid">
				{#each users as user (user.id)}
					<div
						class="user-card"
						onclick={() => handleUserClick(user.userName)}
						role="button"
						tabindex="0"
						onkeydown={(event) => event.key === 'Enter' && handleUserClick(user.userName)}
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
						<div class="user-metadata">
							<span class="metadata-item">
								<Icon icon="mingcute:time-line" class="metadata-icon" />
								Joined {daysAgo(user.createdAt)}
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.search-bar {
		margin-bottom: 32px;
	}

	.users-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 24px;
		margin-top: 24px;
	}

	.user-card {
		background: var(--colorWhite);
		border-radius: 12px;
		padding: 32px 24px;
		text-align: center;
		cursor: pointer;
		border: 1px solid var(--n-03);
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px var(--n-alpha-1);
		display: flex;
		flex-direction: column;
		align-items: center;
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
		margin-bottom: 16px;
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
		margin: 0 0 16px 0;
		line-height: 1.5;
		flex-grow: 1;
	}

	.user-metadata {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		width: 100%;
		padding-top: 12px;
		border-top: 1px solid var(--n-02);
	}

	.metadata-item {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		color: var(--n-05);
	}

	.metadata-icon {
		font-size: 14px;
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
