<script lang="ts">
	import KEYS_CONFIG from '../constants/keys.json';
	import mainStore from '../stores/main.svelte.js';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import playbackStore from '$lib/stores/playback.svelte';

	let isPressed = $state(false);
	const props = $props();

	const config = KEYS_CONFIG[props.keyCode as keyof typeof KEYS_CONFIG];
	const note = $derived(mainStore.keyNoteMap[props.keyCode] || '');
	const noteWithoutOctave = $derived(note.replace(/[0-9]/g, ''));

	const keyClassName = $derived.by(() => {
		const classes = [];

		if (config.isFunctional) {
			classes.push('functionalKey');
			if (isPressed) classes.push('pressedKey');
			return classes.join(' ');
		}

		const isSharp = note?.includes('#');
		const isOctaveNotePressed = mainStore.pressedNotes.includes(noteWithoutOctave);
		if (isOctaveNotePressed) classes.push('octaveNotePressed');
		if (isSharp) classes.push('sharpKey');
		if (isPressed) classes.push('pressedKey');
		if (!isSharp) classes.push('normalKey');
		return classes.join(' ');
	});

	function handleKeyDown(event: KeyboardEvent) {
		if (event.repeat) return;
		event.preventDefault();

		if (event.code === props.keyCode) {
			isPressed = true;
			mainStore.pressedNotes = [...mainStore.pressedNotes, noteWithoutOctave];
			playbackStore.play({ note });
		}
	}

	function handleKeyUp(event: KeyboardEvent) {
		if (event.code === props.keyCode) {
			isPressed = false;
			mainStore.pressedNotes = mainStore.pressedNotes.filter((n) => n !== noteWithoutOctave);
			playbackStore.stop({ note });
		}
	}

	onMount(() => {
		if (browser) {
			window.addEventListener('keydown', handleKeyDown);
			window.addEventListener('keyup', handleKeyUp);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		}
	});
</script>

<div class="QwertyKey {keyClassName}" style="flex: {config.width}">
	<span class="qwertyLabel">{config.label.toUpperCase()}</span>
	<span class="noteLabel">{note}</span>
</div>

<style>
	.QwertyKey {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 1px solid #020617;
		border-radius: 2px;
		cursor: pointer;
	}

	.qwertyLabel {
		font-size: 14px;
		/* font-weight: bold; */
	}

	.noteLabel {
		font-size: 14px;
	}

	.normalKey,
	.functionalKey {
		background: var(--color-zinc-900);
		color: var(--color-zinc-100);
	}

	.normalKey.pressedKey,
	.functionalKey.pressedKey {
		background: var(--color-zinc-700);
		color: var(--color-zinc-100);
	}

	.sharpKey {
		background: var(--color-zinc-800);
		color: var(--color-zinc-100);
	}

	.sharpKey.pressedKey {
		background: var(--color-zinc-600);
		color: var(--color-zinc-100);
	}

	.octaveNotePressed .noteLabel,
	.octaveNotePressed .qwertyLabel {
		/* font-weight: bold; */
		font-size: 16px;
		color: var(--color-zinc-500);
	}

	.functionalKey.octaveNotePressed .noteLabel {
		font-weight: normal;
		font-size: 14px;
		color: var(--color-zinc-100);
	}

	.pressedKey.octaveNotePressed .noteLabel,
	.pressedKey.octaveNotePressed .qwertyLabel {
		font-weight: normal;
		font-size: 14px;
		color: var(--color-zinc-100);
	}
</style>
