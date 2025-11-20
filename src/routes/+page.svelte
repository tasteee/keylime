<script>
	import ChordCardGrid from '$lib/components/ChordCardGrid.svelte'
	import MainControls from '$lib/components/MainControls.svelte'
	import ArrangementPanel from '$lib/components/ArrangementPanel.svelte'
	import PatternEditor from '$lib/components/PatternEditor.svelte'

	let activeView = $state('chords')

	const goToPatternView = () => (activeView = 'patterns')
	const goToChordView = () => (activeView = 'chords')
</script>

<div class="page lightTheme">
	<div class="topbar">
		<div class="logo">KEYLIME</div>
		<nav class="nav">
			<button class="navLink" class:active={activeView === 'chords'} onclick={goToChordView}> Chords </button>
			<button class="navLink" class:active={activeView === 'patterns'} onclick={goToPatternView}> Pattern </button>
		</nav>
	</div>

	<div class="content">
		{#if activeView === 'chords'}
			<ChordCardGrid />
		{/if}

		{#if activeView === 'patterns'}
			<PatternEditor />
		{/if}

		<ArrangementPanel />
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.topbar {
		display: flex;
		align-items: center;
		height: 48px;
		padding: 0 24px;
		gap: 32px;
		border-bottom: 1px solid var(--muted);
		flex-shrink: 0;
	}

	.logo {
		font-size: 20px;
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.nav {
		display: flex;
		gap: 8px;
	}

	.navLink {
		background: none;
		border: none;
		padding: 8px 16px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		color: #666;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.navLink:hover {
		color: #fff;
	}

	.navLink.active {
		color: #fff;
	}

	.content {
		display: flex;
		flex-direction: column;
		justify-content: end;
		flex: 1;
		gap: 8px;
		padding: 8px;
		padding-bottom: 168px;
		overflow-y: hidden;
	}
</style>
