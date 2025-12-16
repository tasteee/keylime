<script lang="ts">
	import projectStore from '$lib/stores/project.svelte'
	import HerButton from './HerButton.svelte'
	import SelectBpm from './SelectBpm.svelte'
	import DialogProjectSettings from './DialogProjectSettings.svelte'

	let isSettingsOpen = $state(false)

	const openSettings = () => {
		isSettingsOpen = true
	}

	const handleSettingsOpenChange = (open: boolean) => {
		isSettingsOpen = open
	}

	const dirtyIndicatorText = $derived(projectStore.isDirty ? '●' : '')
</script>

<div class="herPanel projectInfoPanel">
	<div class="herPanelTitleBox">
		<span class="herPanelTitle">Project</span>
		{#if dirtyIndicatorText}
			<span class="dirtyIndicator">{dirtyIndicatorText}</span>
		{/if}
	</div>

	<span class="projectTitle">{projectStore.title}</span>

	<div class="herPanelControls">
		<SelectBpm />

		<HerButton label="Settings" kind="outline" color="gray" size="small" onclick={openSettings} />
	</div>
</div>

<DialogProjectSettings isOpen={isSettingsOpen} onOpenChange={handleSettingsOpenChange} />

<style>
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

	.herPanelControls {
		margin-left: auto;
	}
</style>
