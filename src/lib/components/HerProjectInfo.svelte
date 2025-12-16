<script lang="ts">
	import projectStore from '$lib/stores/project.svelte'
	import HerButton from './HerButton.svelte'
	import SelectBpm from './SelectBpm.svelte'
	import DialogProjectSettings from './DialogProjectSettings.svelte'
	import { Button } from 'bits-ui'
	import Box from './Box.svelte'

	let isSettingsOpen = $state(false)

	const openSettings = () => {
		isSettingsOpen = true
	}

	const handleSettingsOpenChange = (open: boolean) => {
		isSettingsOpen = open
	}

	const dirtyIndicatorText = $derived(projectStore.isDirty ? '●' : '')
</script>

<div class="herPanel">
	<div class="herPanelTitleBox">
		<span class="herPanelTitle">Project</span>
		{#if dirtyIndicatorText}
			<span class="dirtyIndicator">{dirtyIndicatorText}</span>
		{/if}
	</div>

	<span class="projectTitle">{projectStore.title}</span>

	<div class="herPanelControls">
		<SelectBpm />
		<Button.Root class="ShaBB" onclick={openSettings}>Settings</Button.Root>

		<Box gap="8px">
			<Button.Root class="ShaBB">Options</Button.Root>
			<Button.Root class="ShaBB">Save</Button.Root>
		</Box>
	</div>
</div>

<DialogProjectSettings isOpen={isSettingsOpen} onOpenChange={handleSettingsOpenChange} />

<style>
	:global(.ShaBB) {
		background: #4b5563;
		color: var(--n-00);
		font-size: 12px;
		letter-spacing: 0.5px;
		font-weight: 600;
		padding: 0px 8px;
		height: 36px;
		border-radius: 4px;
	}
	.herPanelTitleBox {
		gap: 8px;
		align-items: center;
	}

	.dirtyIndicator {
		color: #ff6b9d;
		font-size: 20px;
		line-height: 1;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.projectTitle {
		font-size: 16px;
		font-weight: 600;
		color: #525252;
		margin-left: -4px;
	}
</style>
