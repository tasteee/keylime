<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js'
	import mainStore from '../stores/main.svelte.js'

	type KeymapT = 'isomorphic' | 'rightUpTrios' | 'rightDown' | 'rightUp' | 'downRight'

	const handleSelect = (value: string) => {
		const validKeymaps: KeymapT[] = ['isomorphic', 'rightUpTrios', 'rightDown', 'rightUp', 'downRight']
		const isValidKeymap = validKeymaps.includes(value as KeymapT)
		if (!isValidKeymap) return
		mainStore.selectedKeymap = value as KeymapT
	}
</script>

<Select.Root type="single" onValueChange={handleSelect} value={mainStore.selectedKeymap}>
	<Select.Trigger class="h-8 hover:bg-muted/50 px-2 min-w-[120px] border-none bg-transparent shadow-none focus:ring-0">
		<span class="text-xs">
			<span class="herMenuTriggerLabel">Keymap</span>
			<span>{mainStore.selectedKeymap}</span>
		</span>
	</Select.Trigger>
	<Select.Content>
		<Select.Item value="rightUp">rightUp</Select.Item>
		<Select.Item value="rightDown">rightDown</Select.Item>
		<Select.Item value="isomorphic">isomorphic</Select.Item>
		<Select.Item value="rightUpTrios">rightUpTrios</Select.Item>
	</Select.Content>
</Select.Root>
