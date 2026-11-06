<script lang="ts">
	import playbackStore from '$lib/stores/playback.svelte'
	import KEYBOARDS_CONFIG from '../../constants/keyboards.json'
	import QwertyKey from './QwertyKey.svelte'
	import { browser } from '$app/environment'
	import { onMount } from 'svelte'

	type QwertyKeyboardPropsT = {
		layout: keyof typeof KEYBOARDS_CONFIG
	}

	const props: QwertyKeyboardPropsT = $props()
	const config = KEYBOARDS_CONFIG[props.layout]

	onMount(() => {
		if (browser) playbackStore.load()
	})
</script>

<z-surface level="1" kind="soft" isBordered radius="md" inset="sm" isFullWidth>
	<z-column gap="2xs">
		{#each config.rows as row}
			<z-row gap="2xs" class="keyboardRow">
				{#each row as keyCode}
					<QwertyKey {keyCode} />
				{/each}
			</z-row>
		{/each}
	</z-column>
</z-surface>

<style>
	.keyboardRow {
		height: 5rem;
	}
</style>
