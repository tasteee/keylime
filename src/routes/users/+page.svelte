<script lang="ts">
	import { MagnifyingGlass, UsersThree, Clock } from 'phosphor-svelte'
	import { daysAgo } from '$lib/modules/dateTime'
	import { goToPath } from '$lib/modules/navigate'
	import { getPublicUsers } from '$lib/modules/database'
	import PageLayout from '$lib/components/PageLayout.svelte'
	import PageHeader from '$lib/components/PageHeader.svelte'

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
		goToPath(`/users/${userName}`)
	}

	const handleSearch = (event: CustomEvent) => {
		searchText = event.detail.value
		loadPublicUsers({ searchText })
	}

	const handleUserKeyDown = (event: KeyboardEvent, userName: string) => {
		const isEnterKey = event.key === 'Enter'
		if (isEnterKey) handleUserClick(userName)
	}

	const hasNoUsers = $derived(users.length === 0)

	$effect(() => {
		loadPublicUsers()
	})
</script>

<PageLayout>
	<PageHeader title="Discover creators" subtitle="Explore musicians and their chord progressions.">
		{#snippet actions()}
			<div class="userSearch">
				<z-input type="search" value={searchText} placeholder="Search users…" label="Search users" size="sm" oninput={handleSearch}>
					<z-box slot="prefix" isInline><MagnifyingGlass size={14} /></z-box>
				</z-input>
			</div>
		{/snippet}
	</PageHeader>

	{#if isLoading}
		<z-grid minColumnWidth="16rem" gap="md">
			{#each Array.from({ length: 6 }) as _}
				<z-skeleton shape="rect" height="12rem"></z-skeleton>
			{/each}
		</z-grid>
	{:else if hasNoUsers}
		<z-empty-state heading="No users found" description="Try a different name." isBordered>
			<z-box slot="icon" isInline><UsersThree size={32} /></z-box>
		</z-empty-state>
	{:else}
		<z-grid minColumnWidth="16rem" gap="md">
			{#each users as user (user.id)}
				<z-card
					isReactive
					role="button"
					tabindex="0"
					class="userCard"
					onclick={() => handleUserClick(user.userName)}
					onkeydown={(event: KeyboardEvent) => handleUserKeyDown(event, user.userName)}
				>
					<z-column gap="sm" alignsX="center">
						<z-avatar name={user.userName} src={user.avatarUrl ?? undefined} size="xl"></z-avatar>
						<z-text size="xl" weight={600} color="strong">{user.userName}</z-text>
						<z-text size="sm" color="muted">{user.bio || 'No bio yet'}</z-text>
					</z-column>
					<z-separator></z-separator>
					<z-row gap="xs" alignsX="center" alignsY="center">
						<Clock size={14} />
						<z-text size="xs" color="muted">Joined {daysAgo(user.createdAt)}</z-text>
					</z-row>
				</z-card>
			{/each}
		</z-grid>
	{/if}
</PageLayout>

<style>
	.userSearch {
		width: 18rem;
		max-width: 100%;
	}

	.userCard {
		--z-card-gap: var(--spacing-2);
		padding: var(--space-md);
		cursor: pointer;
	}
</style>
