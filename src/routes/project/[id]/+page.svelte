<script lang="ts">
	import { fade } from 'svelte/transition'
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte'
	import ChordCardGrid from '$lib/components/Project/ChordCardGrid.svelte'
	import ProjectInfoBar from '$lib/components/Project/ProjectInfoBar.svelte'
	import PatternEditor from '$lib/components/Project/PatternEditor.svelte'
	import ProgressionPanel from '$lib/components/Project/ProgressionPanel.svelte'
	import TopBar from '$lib/components/Project/TopBar.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import { browser } from '$app/environment'
	import { onMount, onDestroy } from 'svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import Box from '$lib/components/ui/box.svelte'
	import { beforeNavigate, goto } from '$app/navigation'
	import UnsavedChangesDialog from '$lib/components/Project/UnsavedChangesDialog.svelte'
	import { hmu } from '$lib/modules/hitmeup'
	import { calculateStartTimes } from '$lib/helpers/progression'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)
	const isLoading = $derived(projectEditor.state.isLoading)
	const activeView = $derived(projectEditor.state.activeView)

	let showUnsavedDialog = $state(false)
	let pendingNavigation: { to: string | null } | null = $state(null)
	let isNavigationConfirmed = $state(false)

	beforeNavigate(({ cancel, to, type }) => {
		if (isNavigationConfirmed) return
		if (isLoading) return

		if (projectEditor.checkIsDirty()) {
			cancel()
			pendingNavigation = { to: to?.url.href || null }
			showUnsavedDialog = true
		}
	})

	const handleConfirmSave = async () => {
		console.log('handleConfirmSave')
		await projectEditor.save()
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
		if (projectEditor.checkIsDirty()) {
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

		// Get active signals (those within pattern duration)
		const patternActiveDurationBeats = project.patternDurationBars * 4
		const patternActiveSignals = project.patternSignals.filter((signal) => {
			return signal.startTime < patternActiveDurationBeats
		})

		// Calculate startTime for all progression items before passing to playback
		const progressionWithStartTimes = calculateStartTimes({ items: project.progressionChords })

		await playbackStore.perform({
			id: project.id,
			bpm: project.bpm,
			octave: project.octave,
			progressionChords: progressionWithStartTimes,
			patternSignals: patternActiveSignals,
			patternSignalRows: project.patternSignalRows,
			patternDurationBars: patternActiveDurationBeats / 4,
			minVelocity: project.minVelocity,
			maxVelocity: project.maxVelocity
		})
	}

	$effect(() => {
		// Project loading is now handled by ContextFrame
		// This effect is no longer needed
	})

	onMount(() => {
		if (browser) playbackStore.load()

		setTimeout(() => {
			// Configure
			hmu.configure({
				tokens: {
					brandBlue: '#0066CC'
				},
				levels: {
					error: {
						labelStyles: { backgroundColor: '$red', color: '$white' }
					}
				},
				presets: {
					api: {
						level: 'info',
						icon: '🌐',
						prefix: 'API',
						labelStyles: { backgroundColor: '$brandBlue', color: '$white' }
					}
				}
			})

			// Basic logging
			hmu.log('Simple message')
			hmu.error('Something broke!')

			// With chaining
			hmu.withIcon('🔥').withPrefix('ALERT').error('Critical!')

			// Preset usage
			hmu.api('Request completed')

			// Chaining with presets
			hmu.withLabel('v1').api('API ready')
		}, 27777500)
	})

	// When we leave project view, stop playback
	// Project reset is no longer needed since context is route-scoped
	onDestroy(() => {
		if (browser) {
			playbackStore.stop()
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

<div class="projectView lightTheme">
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

				{#if activeView === 'chords'}
					<ChordCardGrid />
				{/if}

				{#if activeView === 'pattern'}
					<PatternEditor />
				{/if}

				<ProgressionPanel />
			</div>
		{/if}
	</div>
</div>

<style>
	.projectView {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		user-select: none;
	}

	.projectView input,
	.projectView .selectableText {
		user-select: text;
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
