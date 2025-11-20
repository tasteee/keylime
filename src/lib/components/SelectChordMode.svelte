<script lang="ts">
	import CHORD_MODES_CONFIG from '../constants/chordModes.json';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import main from '../stores/main.svelte.js';

	const handleSelect = (value: string | undefined) => {
		if (!value) return;
		main.selectedChordMode = value;
	};

	const isChordModeActive = $derived(main.selectedChordMode !== 'Off');
</script>

<div class="selectChordModeContainer">
	<Select.Root type="single" onValueChange={handleSelect} value={main.selectedChordMode}>
		<Select.Trigger class="w-[180px]">
			<span>
				<span class="innerLabel">Chord Mode: </span>
				{main.selectedChordMode}
			</span>
		</Select.Trigger>
		<Select.Content>
			{#each CHORD_MODES_CONFIG as chordMode}
				<Select.Item value={chordMode.name}>{chordMode.name}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	{#if isChordModeActive}
		<Tooltip.Root>
			<Tooltip.Trigger>
				<div class="infoIcon">ⓘ</div>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>When chord mode is active, notes may be played outside scale</p>
			</Tooltip.Content>
		</Tooltip.Root>
	{/if}
</div>

<style>
	.selectChordModeContainer {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.innerLabel {
		font-weight: 500;
	}

	.infoIcon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-zinc-700);
		color: var(--color-zinc-100);
		font-size: 14px;
		cursor: help;
	}
</style>
