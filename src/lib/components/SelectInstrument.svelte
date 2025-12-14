<script lang="ts">
	import INSTRUMENTS_CONFIG from '../constants/instruments.json'
	import * as Select from '$lib/components/ui/select/index.js'
	import output from '../stores/output.svelte'

	const instrumentEntries = Object.entries(INSTRUMENTS_CONFIG.availableInstruments)

	const instruments = instrumentEntries.map(([key, config]) => ({
		value: key,
		label: config.label
	}))

	const currentInstrument = $derived(instruments.find((i) => i.value === output.instrument)?.label ?? output.instrument)
</script>

<Select.Root type="single" name="instrument" bind:value={output.instrument}>
	<Select.Trigger class="h-8 hover:bg-muted/50 px-2 min-w-[140px] border-none bg-transparent shadow-none focus:ring-0">
		<span class="text-xs">
			<span class="text-muted-foreground mr-1">Instrument</span>
			<span class="font-medium text-foreground">{currentInstrument}</span>
		</span>
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			{#each instruments as instrument (instrument.value)}
				<Select.Item value={instrument.value} label={instrument.label}>
					{instrument.label}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
