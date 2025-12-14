<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import output from '../stores/output.svelte'
</script>

<Select.Root type="single" bind:value={output.type}>
	<Select.Trigger class="h-8 hover:bg-muted/50 px-2 min-w-[100px] border-none bg-transparent shadow-none focus:ring-0">
		<span class="text-xs">
			<span class="text-muted-foreground mr-1">Output</span>
			<span class="font-medium text-foreground">{output.type}</span>
		</span>
	</Select.Trigger>
	<Select.Content>
		<Select.Item value="Instrument">Instrument</Select.Item>
		<Select.Item value="MIDI">MIDI</Select.Item>
	</Select.Content>
</Select.Root>
