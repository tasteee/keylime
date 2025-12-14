<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import mainStore from '../stores/main.svelte.js'

	const handleSelect = (value: string) => {
		mainStore.selectedKey = value
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={mainStore.selectedKey}>
	<Select.Trigger class="h-8 hover:bg-muted/50 px-2 min-w-[70px] border-none bg-transparent shadow-none focus:ring-0">
		<span class="text-xs">
			<span class="text-muted-foreground mr-1">Key</span>
			<span class="font-medium text-foreground">{mainStore.selectedKey}</span>
		</span>
	</Select.Trigger>
	<Select.Content>
		<Select.Item value="A">A</Select.Item>
		<Select.Item value="A#">A#</Select.Item>
		<Select.Item value="B">B</Select.Item>
		<Select.Item value="C">C</Select.Item>
		<Select.Item value="C#">C#</Select.Item>
		<Select.Item value="D">D</Select.Item>
		<Select.Item value="D#">D#</Select.Item>
		<Select.Item value="E">E</Select.Item>
		<Select.Item value="F">F</Select.Item>
		<Select.Item value="F#">F#</Select.Item>
		<Select.Item value="G">G</Select.Item>
		<Select.Item value="G#">G#</Select.Item>
	</Select.Content>
</Select.Root>
