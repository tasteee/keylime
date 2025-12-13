<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js'
	import output from '../stores/output.svelte'
</script>

<ToggleGroup.Root class="SelectOutputType" type="single" bind:value={output.type}>
	<ToggleGroup.Item class="toggleGroupItem" value="Instrument">Instrument</ToggleGroup.Item>
	<ToggleGroup.Item class="toggleGroupItem" value="MIDI">MIDI</ToggleGroup.Item>
</ToggleGroup.Root>

<style>
	:global(.SelectOutputType) {
		border: 1px solid var(--input);
	}
	:global(.toggleGroupItem) {
		flex: 0 0 auto !important;
		min-width: fit-content !important;
	}
</style>
