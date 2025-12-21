<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar'
	import Icon from '@iconify/svelte'
	import { authStore } from '$lib/stores/auth.svelte'
	import Badge from '$lib/components/ui/badge/badge.svelte'
	import Box from '$lib/components/ui/box.svelte'

	type ProjectCardPropsT = {
		project: {
			id: string
			title: string
			description: string
			key: string
			scale: string
			bpm: number
			chordSymbols: string[]
			updatedAt: Date
		}
		daysAgo: string
		onOpenProject: (projectId: string) => void
	}

	const props: ProjectCardPropsT = $props()

	const handleClick = () => {
		props.onOpenProject(props.project.id)
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		const isEnterKey = event.key === 'Enter'
		if (!isEnterKey) return
		props.onOpenProject(props.project.id)
	}
</script>

<Box class="userProjectCard" role="button" tabIndex={0} onclick={handleClick} onkeydown={handleKeyDown}>
	<Box gap="12px" isColumn justify="stretch" width="100%" class="userProjectCardContent">
		<Box class="timeAgo" paddingLeft="44px">
			<p class="days-ago">{props.daysAgo}</p>
		</Box>

		<Box align="center" gap="12px">
			<Avatar.Root class="userProjectCardAvatar size-8">
				<Avatar.Fallback class="logoFont">
					{authStore.userProfile?.userName?.slice(0, 2).toUpperCase() || 'U'}
				</Avatar.Fallback>
			</Avatar.Root>
			<h3 class="project-title">{props.project.title}</h3>
		</Box>

		<Box gap="0px" class="userProjectCardFooter">
			<Badge color="neutral" size="small" kind="ghost">
				<Icon icon="mingcute:music-line" class="size-3 mr-1" />
				{props.project.key}
				{props.project.scale}
			</Badge>
			<Badge color="neutral" size="small" kind="ghost">
				<Icon icon="mingcute:time-line" class="size-3 mr-1" />
				{props.project.bpm} BPM
			</Badge>
		</Box>

		<Box padding="8px" gap="12px" class="userProjectCardChordSymbols">
			{#each props.project.chordSymbols as symbol (symbol)}
				<Badge kind="solid" color="dark" size="small">{symbol}</Badge>
			{/each}
		</Box>
	</Box>
</Box>

<style>
	:global .userProjectCardContent {
		padding: 24px;
		padding-top: 14px;
		position: relative;
	}

	:global .userProjectCardContent .userProjectCardChordSymbols {
		background: var(--n-01);
		border: 1px solid var(--n-03);
		border-radius: 4px;
		flex-wrap: wrap;
	}

	:global .userProjectCardContent .timeAgo {
		position: absolute;
		font-style: italic;
		top: 36px;
		font-size: 12px;
		color: var(--n-05);
	}

	:global .userProjectCardAvatar {
		position: relative;
		top: 10px;
	}

	:global .userProjectCard {
		background: var(--colorWhite);
		border-radius: 8px;
		box-shadow: 0 2px 8px var(--n-alpha-1);
		transition: all 0.2s ease;
		cursor: pointer;
		border: 1px solid var(--n-03);
		overflow: hidden;
	}

	:global .userProjectCard:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px var(--n-alpha-2);
		border-color: var(--n-04);
	}

	:global .userProjectCardHeader {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 12px;
	}

	.project-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
		color: var(--n-09);
	}

	:global .userProjectCardDescription {
		font-size: 14px;
		color: var(--n-06);
		margin: 0 0 16px 0;
		line-height: 1.4;
	}

	:global .userProjectCardFooter {
		padding-top: 8px;
	}
</style>
