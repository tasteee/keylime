<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar'
	import Icon from '@iconify/svelte'
	import { authStore } from '$lib/stores/auth.svelte'
	import Badge from '$lib/components/ui/badge/badge.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import Button from '$lib/components/ui/button/button.svelte'
	import ChordBadge from '$lib/components/ChordBadge.svelte'
	import * as Dialog from '$lib/components/ui/dialog'
	import { goto } from '$app/navigation'
	import { getContext } from 'svelte'
	import { calculateStartTimes } from '$lib/helpers/progression'
	import ConfirmDeleteDialog from './Dashboard/ConfirmDeleteDialog.svelte'

	type ProjectCardPropsT = {
		project: {
			id: string
			title: string
			description: string
			key: string
			scale: string
			bpm: number
			octave: string
			chordSymbols: string[]
			updatedAt: Date
			userId: string
			progressionChords: ProgressionChordT[]
			patternSignals: SignalT[]
			patternSignalRows: SignalRowsT
			patternDurationBars: number
			minVelocity: number
			maxVelocity: number
		}
		daysAgo: string
		onOpenProject: (projectId: string) => void
		onCloneProject?: (projectId: string) => Promise<void>
		onDeleteProject?: (projectId: string) => Promise<void>
	}

	const props: ProjectCardPropsT = $props()
	const playbackContext = getContext<PlaybackContextT>('playback')

	let isDeleteDialogOpen = $state(false)

	const isOwnedByCurrentUser = $derived(props.project.userId === authStore.authUser?.id)
	const isPlayingThisProject = $derived(
		playbackContext.state.isPlaying && playbackContext.state.currentProjectId === props.project.id
	)

	const handleClick = () => {
		props.onOpenProject(props.project.id)
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		const isEnterKey = event.key === 'Enter'
		if (!isEnterKey) return
		props.onOpenProject(props.project.id)
	}

	const handleUserClick = (event: MouseEvent) => {
		event.stopPropagation()
		const userName = authStore.userProfile?.userName
		if (userName) goto(`/users/${userName}`)
	}

	const handlePlayToggle = async (event: MouseEvent) => {
		event.stopPropagation()

		const isCurrentlyPlaying = isPlayingThisProject
		if (isCurrentlyPlaying) {
			playbackContext.stop()
			return
		}

		// Calculate startTimes for progression chords
		const progressionWithStartTimes = calculateStartTimes({ items: props.project.progressionChords })

		await playbackContext.perform({
			id: props.project.id,
			bpm: props.project.bpm,
			octave: props.project.octave,
			progressionChords: progressionWithStartTimes,
			patternSignals: props.project.patternSignals,
			patternSignalRows: props.project.patternSignalRows,
			patternDurationBars: props.project.patternDurationBars,
			minVelocity: props.project.minVelocity,
			maxVelocity: props.project.maxVelocity
		})
	}

	const handleOpenOrClone = async (event: MouseEvent) => {
		event.stopPropagation()

		const shouldOpen = isOwnedByCurrentUser
		if (shouldOpen) {
			goto(`/project/${props.project.id}`)
			return
		}

		// Clone functionality
		if (props.onCloneProject) {
			await props.onCloneProject(props.project.id)
		}
	}

	const handleDeleteClick = (event: MouseEvent) => {
		event.stopPropagation()
		isDeleteDialogOpen = true
	}

	const handleConfirmDelete = async () => {
		await props.onDeleteProject?.(props.project.id)
		isDeleteDialogOpen = false
	}

	const handleCancelDelete = () => {
		isDeleteDialogOpen = false
	}
</script>

<Box class="userProjectCard" role="button" tabIndex={0} onclick={handleClick} onkeydown={handleKeyDown}>
	<Box gap="12px" isColumn justify="stretch" width="100%" class="userProjectCardContent">
		{#if isOwnedByCurrentUser}
			<Button class="deleteButton" onclick={handleDeleteClick} size="small" color="neutral" isIcon={true}>
				<Icon icon="mingcute:delete-2-line" width="16px" height="16px" />
			</Button>
		{/if}

		<Box class="timeAgo" paddingLeft="44px">
			<p class="days-ago">{props.daysAgo}</p>
		</Box>

		<Box align="center" gap="12px">
			<Avatar.Root class="userProjectCardAvatar size-8" onclick={handleUserClick}>
				<Avatar.Fallback class="logoFont">
					{authStore.userProfile?.userName?.slice(0, 2).toUpperCase() || 'U'}
				</Avatar.Fallback>
			</Avatar.Root>
			<h3 class="projectTitle">{props.project.title}</h3>
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
			{#each props.project.progressionChords as chord (chord.id)}
				<ChordBadge {...chord} />
			{/each}
		</Box>

		<Box gap="8px" paddingTop="8px" class="projectCardActions">
			<Button onclick={handlePlayToggle} size="medium" color="neutral" isIcon={true}>
				{#if isPlayingThisProject}
					<Icon icon="mingcute:stop-fill" width="18px" height="18px" />
				{:else}
					<Icon icon="mingcute:play-fill" width="18px" height="18px" />
				{/if}
			</Button>

			<Button onclick={handleOpenOrClone} size="medium" color="brand" class="flex-1">
				{#if isOwnedByCurrentUser}
					<Icon icon="mingcute:folder-open-line" class="size-4 mr-1" />
					Open
				{:else}
					<Icon icon="mingcute:copy-2-line" class="size-4 mr-1" />
					Clone
				{/if}
			</Button>
		</Box>
	</Box>
</Box>

{#if isDeleteDialogOpen}
	{#if isDeleteDialogOpen}
		<ConfirmDeleteDialog
			isOpen
			projectTitle={props.project.title}
			onConfirm={handleConfirmDelete}
			onOpenChange={(open) => {
				isDeleteDialogOpen = open
			}}
		/>
	{/if}
{/if}

<style>
	:global .userProjectCardContent {
		padding: 24px;
		padding-top: 14px;
		position: relative;
	}

	:global .userProjectCardContent .deleteButton {
		position: absolute;
		top: 12px;
		right: 12px;
		z-index: 10;
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	:global .userProjectCardContent .deleteButton:hover {
		opacity: 1;
	}

	:global .userProjectCardContent .userProjectCardChordSymbols {
		background: var(--n-01);
		border: 1px solid var(--n-03);
		border-radius: 4px;
		flex-wrap: wrap;
	}

	:global .userProjectCardContent .projectCardActions {
		display: flex;
		align-items: center;
		border-top: 1px solid var(--n-03);
		padding-top: 12px !important;
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

	.projectTitle {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
		color: var(--n-09);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
