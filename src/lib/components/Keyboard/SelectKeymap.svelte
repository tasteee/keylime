<script lang="ts">
	import SelectControl from '$lib/components/Project/SelectControl.svelte'
	import { keyboardStore } from '../../stores/keyboard.svelte.js'

	type KeymapT = 'isomorphic' | 'rightUpTrios' | 'rightDown' | 'rightUp' | 'downRight'

	const keymapNames: KeymapT[] = ['rightUp', 'rightDown', 'isomorphic', 'rightUpTrios']
	const keymapOptions = keymapNames.map((keymapName) => ({ value: keymapName, label: keymapName }))

	const handleSelect = (value: string) => {
		const isValidKeymap = keymapNames.includes(value as KeymapT)
		if (!isValidKeymap) return
		keyboardStore.selectedKeymap = value as KeymapT
	}
</script>

<SelectControl label="Keymap" value={keyboardStore.selectedKeymap} options={keymapOptions} onValueChange={handleSelect} />
