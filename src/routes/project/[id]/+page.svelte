<script lang="ts">
	import ChordCardGrid from '$lib/components/ChordCardGrid.svelte'
	import ProjectInfoBar from '$lib/components/ProjectInfoBar.svelte'
	import output from '$lib/stores/output.svelte'
	import PatternEditor from '$lib/components/PatternEditor.svelte'
	import ProgressionPanel from '$lib/components/ProgressionPanel.svelte'
	import TopBar from '$lib/components/TopBar.svelte'
	import InfoBar from '$lib/components/InfoBar.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import { browser } from '$app/environment'
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import projectStore from '$lib/stores/project.svelte'
	import projectsStore from '$lib/stores/projects.svelte'

	onMount(() => {
		if (browser) playbackStore.load()

		// Mock loading project data
		const projectId = $page.params.id
		const project = projectsStore.projects.find((p) => p.id === projectId)
		if (project) {
			projectStore.id = project.id
			projectStore.title = project.title
			projectStore.bpm = project.bpm
			projectStore.key = project.key
			projectStore.scale = project.scale
			// In a real app, we'd load the full project state here
		}
	})

	let activeView = $state('chords')

	const handleKeyDown = (event: KeyboardEvent) => {
		const isSpaceKey = event.code === 'Space'
		if (!isSpaceKey) return

		const isTypingInInput = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
		if (isTypingInInput) return

		event.preventDefault()
		playbackStore.togglePlayback()
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="app lightTheme">
	<TopBar bind:activeView />

	<div class="content">
		<ProjectInfoBar />

		{#if activeView === 'chords'}
			<ChordCardGrid />
		{/if}

		{#if activeView === 'pattern'}
			<PatternEditor />
		{/if}

		<ProgressionPanel />
		<!-- <BottomBar /> -->
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
	}
</style>
