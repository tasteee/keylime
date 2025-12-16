<script lang="ts">
	import ChordCardGrid from '$lib/components/ChordCardGrid.svelte'
	import HerProjectInfo from '$lib/components/HerProjectInfo.svelte'
	import output from '$lib/stores/output.svelte'
	import PatternEditor from '$lib/components/PatternEditor.svelte'
	import ProgressionPanel from '$lib/components/ProgressionPanel.svelte'
	import TopBar from '$lib/components/TopBar.svelte'
	import BottomBar from '$lib/components/BottomBar.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import { browser } from '$app/environment'
	import { onMount } from 'svelte'

	onMount(() => {
		if (browser) playbackStore.load()
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
		<HerProjectInfo />

		{#if activeView === 'chords'}
			<ChordCardGrid />
		{/if}

		{#if activeView === 'patterns'}
			<PatternEditor />
		{/if}

		<ProgressionPanel />
		<BottomBar />
	</div>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
		padding: 12px;
	}
	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 16px;
		min-height: 0;
		overflow: hidden;
	}
</style>
