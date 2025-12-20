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

<div class="QwertyKeyboard">
	{#each config.rows as row}
		<div class="row">
			{#each row as keyCode}
				<QwertyKey {keyCode} />
			{/each}
		</div>
	{/each}
</div>

<style>
	.QwertyKeyboard {
		width: 100%;
		display: flex;
		flex-direction: column;
		border: 1px solid #020617;
		border-radius: 2px;
		padding: 8px;
		gap: 2px;
	}

	.row {
		display: flex;
		gap: 2px;
		height: 80px;
	}
</style>
