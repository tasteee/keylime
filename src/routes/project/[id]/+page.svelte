<script lang="ts">
	import ChordCardGrid from '$lib/components/Project/ChordCardGrid.svelte'
	import PatternEditor from '$lib/components/Project/PatternEditor.svelte'
	import ProgressionPanel from '$lib/components/Project/ProgressionPanel.svelte'
	import TopBar from '$lib/components/Project/TopBar.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import { browser } from '$app/environment'
	import { onMount, onDestroy } from 'svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { beforeNavigate, goto } from '$app/navigation'
	import UnsavedChangesDialog from '$lib/components/Project/UnsavedChangesDialog.svelte'
	import { hmu } from '$lib/modules/hitmeup'
	import { calculateStartTimes } from '$lib/helpers/progression'
	import { isTypingInTextField } from '$lib/helpers/typing'
	import output from '$lib/stores/output.svelte'

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
		const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's'
		if (isSaveShortcut) {
			event.preventDefault()
			if (projectEditor.checkIsDirty()) await projectEditor.save()
			return
		}

		const isTildeKey = event.code === 'Backquote'
		if (isTildeKey && !isTypingInTextField(event)) {
			event.preventDefault()
			const isChordMode = output.chordPreviewMode === 'chord'
			output.chordPreviewMode = isChordMode ? 'pattern' : 'chord'
			return
		}

		const isSpaceKey = event.code === 'Space'
		if (!isSpaceKey) return

		if (isTypingInTextField(event)) return

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
			doesPatternResetOnChordChange: project.doesPatternResetOnChordChange,
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
	isOpen={showUnsavedDialog}
	onConfirm={handleConfirmSave}
	onDiscard={handleDiscard}
	onCancel={handleCancel}
/>

<z-column class="projectView">
	<TopBar />

	<div class="content">
		{#if isLoading}
			<z-column gap="sm" inset="md" isFullHeight class="loadingState">
				<z-skeleton shape="rect" height="3rem"></z-skeleton>
				<z-grid minColumnWidth="10rem" gap="sm">
					{#each Array.from({ length: 18 }) as _}
						<z-skeleton shape="rect" height="5rem"></z-skeleton>
					{/each}
				</z-grid>
			</z-column>
		{/if}

		{#if !isLoading}
			<z-column isFullHeight>
				{#if activeView === 'chords'}
					<ChordCardGrid />
				{/if}

				{#if activeView === 'pattern'}
					<PatternEditor />
				{/if}

				<ProgressionPanel />
			</z-column>
		{/if}
	</div>
</z-column>

<style>
	.projectView {
		height: 100%;
		background: linear-gradient(45deg, #0b0c0b, #131116, var(--color-neutral-0));
		overflow: hidden;
		user-select: none;
	}

	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		position: relative;
	}

	.loadingState {
		overflow: hidden;
	}
</style>
