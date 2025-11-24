<script>
	import ChordCardGrid from '$lib/components/ChordCardGrid.svelte'
	import MainControls from '$lib/components/MainControls.svelte'
	import output from '$lib/stores/output.svelte'
	import SelectKey from '$lib/components/SelectKey.svelte'
	import SelectKeymap from '$lib/components/SelectKeymap.svelte'
	import SelectOctave from '$lib/components/SelectOctave.svelte'
	import SelectScale from '$lib/components/SelectScale.svelte'
	import SelectOutputType from '$lib/components/SelectOutputType.svelte'
	import SelectInstrument from '$lib/components/SelectInstrument.svelte'
	import SelectMidiDevice from '$lib/components/SelectMidiDevice.svelte'
	import SelectMidiChannel from '$lib/components/SelectMidiChannel.svelte'
	import SelectChordMode from '$lib/components/SelectChordMode.svelte'
	import SelectVelocity from '$lib/components/SelectVelocity.svelte'
	import PatternEditor from '$lib/components/PatternEditor.svelte'
	import ProgressionPanel from '$lib/components/ProgressionPanel.svelte'

	import playbackStore from '$lib/stores/playback.svelte'
	import { browser } from '$app/environment'
	import { onMount, onDestroy } from 'svelte'

	const props = $props()

	onMount(() => {
		if (browser) {
			playbackStore.load()
		}
	})

	const isInstrument = $derived(output.type === 'Instrument')
	const isMidi = $derived(output.type === 'MIDI')
	const isMidiDeviceSelected = $derived(isMidi && output.midiDeviceName)

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

	<div class="controls">
		<div class="controlsRow">
			<SelectKey />
			<SelectScale />
			<SelectOctave />
			<SelectKeymap />
			<SelectVelocity />
			<SelectChordMode />
		</div>

		<div class="controlsRow">
			<SelectOutputType />

			{#if isInstrument}
				<SelectInstrument />
			{/if}

			{#if isMidi}
				<SelectMidiDevice />
			{/if}

			{#if isMidiDeviceSelected}
				<SelectMidiChannel />
			{/if}
		</div>
	</div>

	<div class="content">
		{#if activeView === 'chords'}
			<ChordCardGrid />
		{/if}

		{#if activeView === 'patterns'}
			<PatternEditor />
		{/if}

		<ProgressionPanel />
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

	.controls {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.controlsRow {
		width: 100%;
		display: flex;
		gap: 8px;
	}
</style>
