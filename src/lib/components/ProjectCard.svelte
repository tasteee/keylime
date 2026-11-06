<script lang="ts">
	import { getContext } from 'svelte'
	import { Play, Stop, Trash, FolderOpen, CopySimple, MusicNotes, Clock } from 'phosphor-svelte'
	import { useActiveUser } from '$lib/helpers/useActiveUser.svelte'
	import { goToPath } from '$lib/modules/navigate'
	import { calculateStartTimes } from '$lib/helpers/progression'
	import ChordBadge from '$lib/components/ChordBadge.svelte'

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
			userName?: string
			avatarUrl?: string | null
			progressionChords: ProgressionItemT[]
			patternSignals: SignalT[]
			patternSignalRows: SignalRowsT
			patternDurationBars: number
			doesPatternResetOnChordChange?: boolean
			minVelocity: number
			maxVelocity: number
		}
		daysAgo: string
		onOpenProject: (projectId: string) => void
		onCloneProject?: (projectId: string) => Promise<void>
		onDeleteProject?: (projectId: string) => void
	}

	const props: ProjectCardPropsT = $props()
	const playbackContext = getContext<PlaybackContextT>('playback')
	const activeUser = useActiveUser()

	const isOwnedByCurrentUser = $derived(props.project.userId === activeUser?.id)
	const canDelete = $derived(isOwnedByCurrentUser && Boolean(props.onDeleteProject))
	const isPlayingThisProject = $derived(
		playbackContext.state.isPlaying && playbackContext.state.currentProjectId === props.project.id
	)
	const authorName = $derived(props.project.userName ?? activeUser?.userName ?? 'user')
	const authorAvatarUrl = $derived(props.project.avatarUrl ?? (isOwnedByCurrentUser ? activeUser?.avatarUrl : null))
	const primaryActionLabel = $derived(isOwnedByCurrentUser ? 'Open' : 'Clone')
	const keyAndScaleLabel = $derived(`${props.project.key} ${props.project.scale}`)
	const bpmLabel = $derived(`${props.project.bpm} BPM`)
	const hasChords = $derived(props.project.progressionChords.length > 0)

	const handleCardClick = () => {
		props.onOpenProject(props.project.id)
	}

	const handleCardKeyDown = (event: KeyboardEvent) => {
		const isEnterKey = event.key === 'Enter'
		if (!isEnterKey) return
		props.onOpenProject(props.project.id)
	}

	const handleAuthorClick = (event: MouseEvent) => {
		event.stopPropagation()
		goToPath(`/users/${authorName}`)
	}

	const handlePlayToggle = async (event: MouseEvent) => {
		event.stopPropagation()

		if (isPlayingThisProject) {
			playbackContext.stop()
			return
		}

		const progressionWithStartTimes = calculateStartTimes({ items: props.project.progressionChords })

		await playbackContext.perform({
			id: props.project.id,
			bpm: props.project.bpm,
			octave: props.project.octave,
			progressionChords: progressionWithStartTimes,
			patternSignals: props.project.patternSignals,
			patternSignalRows: props.project.patternSignalRows,
			patternDurationBars: props.project.patternDurationBars,
			doesPatternResetOnChordChange: props.project.doesPatternResetOnChordChange,
			minVelocity: props.project.minVelocity,
			maxVelocity: props.project.maxVelocity
		})
	}

	const handleOpenOrClone = async (event: MouseEvent) => {
		event.stopPropagation()

		if (isOwnedByCurrentUser) {
			goToPath(`/project/${props.project.id}`)
			return
		}

		await props.onCloneProject?.(props.project.id)
	}

	const handleDeleteClick = (event: MouseEvent) => {
		event.stopPropagation()
		props.onDeleteProject?.(props.project.id)
	}
</script>

<z-card isReactive role="button" tabindex="0" onclick={handleCardClick} onkeydown={handleCardKeyDown} class="projectCard">
	<z-row alignsY="center" alignsX="between" gap="sm">
		<z-row alignsY="center" gap="sm" class="projectCardAuthor">
			<z-button kind="plain" size="sm" onclick={handleAuthorClick} aria-label={`View ${authorName}`}>
				<z-avatar name={authorName} src={authorAvatarUrl ?? undefined} size="sm"></z-avatar>
			</z-button>
			<z-column>
				<z-text size="lg" weight={600} color="strong" class="projectCardTitle">{props.project.title}</z-text>
				<z-text size="xs" color="muted">{props.daysAgo}</z-text>
			</z-column>
		</z-row>

		{#if canDelete}
			<z-tooltip content="Delete project" placement="left">
				<z-button kind="ghost" tone="danger" size="sm" onclick={handleDeleteClick} aria-label="Delete project">
					<Trash size={16} />
				</z-button>
			</z-tooltip>
		{/if}
	</z-row>

	<z-row gap="xs" alignsY="center" class="projectCardMeta">
		<MusicNotes size={14} />
		<z-text size="xs" color="muted">{keyAndScaleLabel}</z-text>
		<span class="projectCardDot"></span>
		<Clock size={14} />
		<z-text size="xs" color="muted">{bpmLabel}</z-text>
	</z-row>

	<z-surface level="1" kind="soft" inset="sm" radius="md" isFullWidth class="projectCardChords">
		<z-row gap="xs" doesWrap>
			{#each props.project.progressionChords as item (item.id)}
				<ChordBadge {item} />
			{/each}
			{#if !hasChords}
				<z-text size="xs" color="muted">No chords yet</z-text>
			{/if}
		</z-row>
	</z-surface>

	<z-row gap="sm" alignsY="center">
		<z-button kind="soft" onclick={handlePlayToggle} aria-label={isPlayingThisProject ? 'Stop' : 'Play'}>
			{#if isPlayingThisProject}
				<Stop size={18} weight="fill" />
			{:else}
				<Play size={18} weight="fill" />
			{/if}
		</z-button>

		<z-button tone="primary" isFullWidth onclick={handleOpenOrClone}>
			{#if isOwnedByCurrentUser}
				<FolderOpen size={16} />
			{:else}
				<CopySimple size={16} />
			{/if}
			{primaryActionLabel}
		</z-button>
	</z-row>
</z-card>

<style>
	.projectCard {
		--z-card-gap: var(--spacing-2);
		padding: var(--space-md);
		cursor: pointer;
	}

	.projectCardMeta {
		color: var(--muted-foreground);
	}

	.projectCardDot {
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: var(--border);
		margin-inline: var(--space-2xs);
	}

	.projectCardAuthor {
		min-width: 0;
	}

	.projectCardTitle {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
