<script lang="ts">
	import ChordCardGrid from '$lib/components/ChordCardGrid.svelte'
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

<div class="page lightTheme">
	<TopBar bind:activeView />

	<div class="content">
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
	.page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
		background-color: var(--background);
	}

	.content {
		display: flex;
		flex-direction: column;
		justify-content: end;
		flex: 1;
		gap: 8px;
		padding: 8px;
		padding-bottom: calc(var(--progression-height) + var(--bottombar-height) + 16px);
		overflow-y: hidden;
		position: relative;
	}
</style>
