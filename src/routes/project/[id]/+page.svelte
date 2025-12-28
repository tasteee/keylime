<script lang="ts">
	import { fade } from 'svelte/transition'
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte'
	import ChordCardGrid from '$lib/components/Project/ChordCardGrid.svelte'
	import ProjectInfoBar from '$lib/components/Project/ProjectInfoBar.svelte'
	import PatternEditor from '$lib/components/Project/PatternEditor.svelte'
	import ProgressionPanel from '$lib/components/Project/ProgressionPanel.svelte'
	import TopBar from '$lib/components/Project/TopBar.svelte'
	import InfoBar from '$lib/components/Project/InfoBar.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import { browser } from '$app/environment'
	import { onMount, onDestroy } from 'svelte'
	import { page } from '$app/stores'
	import projectStore from '$lib/stores/project.svelte'
	import Box from '$lib/components/ui/box.svelte'
	import { beforeNavigate, goto } from '$app/navigation'
	import UnsavedChangesDialog from '$lib/components/Project/UnsavedChangesDialog.svelte'

	let currentProjectId = $state<string | null>(null)
	let isLoading = $derived(
		projectStore.isLoading || ($page.params.id && $page.params.id !== 'new' && $page.params.id !== projectStore.id)
	)

	let showUnsavedDialog = $state(false)
	let pendingNavigation: { to: string | null } | null = $state(null)
	let isNavigationConfirmed = $state(false)

	beforeNavigate(({ cancel, to, type }) => {
		if (isNavigationConfirmed) return
		if (isLoading) return

		if (projectStore.checkUnsavedChanges()) {
			cancel()
			pendingNavigation = { to: to?.url.href || null }
			showUnsavedDialog = true
		}
	})

	const handleConfirmSave = async () => {
		await projectStore.save()
		isNavigationConfirmed = true
		showUnsavedDialog = false
		if (pendingNavigation?.to) {
			goto(pendingNavigation.to)
		}
	}

	const handleDiscard = () => {
		isNavigationConfirmed = true
		showUnsavedDialog = false
		if (pendingNavigation?.to) {
			goto(pendingNavigation.to)
		}
	}

	const handleCancel = () => {
		showUnsavedDialog = false
		pendingNavigation = null
	}

	const handleBeforeUnload = (e: BeforeUnloadEvent) => {
		if (projectStore.checkUnsavedChanges()) {
			e.preventDefault()
			e.returnValue = ''
		}
	}

	const handleKeyDown = async (event: KeyboardEvent) => {
		const isSpaceKey = event.code === 'Space'
		if (!isSpaceKey) return

		const isTypingInInput = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
		if (isTypingInInput) return

		event.preventDefault()

		const isCurrentlyPlaying = playbackStore.isPlaying
		if (isCurrentlyPlaying) {
			playbackStore.stop()
			return
		}

		await playbackStore.perform({
			id: projectStore.id,
			bpm: projectStore.bpm,
			octave: projectStore.octave,
			progressionChords: projectStore.progressionChords,
			patternSignals: projectStore.patternActiveSignals,
			patternSignalRows: projectStore.patternSignalRows,
			patternDurationBars: projectStore.patternActiveDurationBeats / 4
		})
	}

	$effect(() => {
		if (!browser) return
		const projectId = $page.params.id

		if (projectId && projectId !== currentProjectId) {
			currentProjectId = projectId
			projectStore.load(projectId)
		}
	})

	onMount(() => {
		if (browser) playbackStore.load()
	})

	// When we leave project view, stop playback and reset the
	// project store so that when we return it's fresh.
	onDestroy(() => {
		if (browser) {
			playbackStore.stop()
			projectStore.reset()
		}
	})
</script>

<svelte:window onkeydown={handleKeyDown} onbeforeunload={handleBeforeUnload} />

<UnsavedChangesDialog
	bind:isOpen={showUnsavedDialog}
	onConfirm={handleConfirmSave}
	onDiscard={handleDiscard}
	onCancel={handleCancel}
/>

<div class="app lightTheme">
	<TopBar />

	<div class="content">
		{#if isLoading}
			<div
				transition:fade={{ duration: 300 }}
				class="inset-0 p-2 absolute z-50 flex h-full w-full flex-col gap-[1px] overflow-hidden bg-[var(--n-02)]"
			>
				<Skeleton height={48} width="100%" />
				<Box width="100%" height="1px" />
				<Skeleton height={54} width="100%" />
				<Box width="100%" height="1px" />

				<div class="containerrr">
					{#each Array.from({ length: 18 }) as _}
						<Skeleton border={1} height="100px" width="170px" />
					{/each}
				</div>

				<Skeleton height={48} width="100%" />
				<Skeleton height={96} width="100%" class="opacity-90" />
				<Skeleton height={48} width="100%" class="opacity-80" />
			</div>
		{/if}

		{#if !isLoading}
			<div class="flex h-full w-full flex-col">
				<ProjectInfoBar />

				{#if projectStore.activeView === 'chords'}
					<ChordCardGrid />
				{/if}

				{#if projectStore.activeView === 'pattern'}
					<PatternEditor />
				{/if}

				<ProgressionPanel />
			</div>
		{/if}
	</div>
	<InfoBar />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		position: relative;
	}

	.containerrr {
		align-content: start;
		display: grid;
		flex: 1;
		grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
		overflow: hidden;
		overflow-y: auto;
		width: 100%;
		border-right: none;
		border-bottom: none;
		padding: 12px;
		background: var(--n-02);
	}
</style>
