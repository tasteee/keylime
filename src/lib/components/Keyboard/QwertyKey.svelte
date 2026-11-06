<script lang="ts">
	import KEYS_CONFIG from '../../constants/keys.json'
	import { keyboardStore } from '../../stores/keyboard.svelte.js'
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'
	import playbackStore from '$lib/stores/playback.svelte'

	let isPressed = $state(false)
	const props = $props()

	const config = KEYS_CONFIG[props.keyCode as keyof typeof KEYS_CONFIG]
	const note = $derived(keyboardStore.keyNoteMap[props.keyCode] || '')
	const noteWithoutOctave = $derived(note ? note.replace(/[0-9]/g, '') : '')

	const keyClassName = $derived.by(() => {
		const classes = []

		if (config.isFunctional) {
			classes.push('functionalKey')
			if (isPressed) classes.push('pressedKey')
			return classes.join(' ')
		}

		const isSharp = note?.includes('#')
		const isOctaveNotePressed = keyboardStore.pressedNotes.includes(noteWithoutOctave)
		if (isOctaveNotePressed) classes.push('octaveNotePressed')
		if (isSharp) classes.push('sharpKey')
		if (isPressed) classes.push('pressedKey')
		if (!isSharp) classes.push('normalKey')
		return classes.join(' ')
	})

	function handleKeyDown(event: KeyboardEvent) {
		if (event.repeat) return
		event.preventDefault()

		if (event.code === props.keyCode) {
			isPressed = true
			keyboardStore.pressedNotes = [...keyboardStore.pressedNotes, noteWithoutOctave]
			playbackStore.playNote({ note })
		}
	}

	function handleKeyUp(event: KeyboardEvent) {
		if (event.code === props.keyCode) {
			isPressed = false
			keyboardStore.pressedNotes = keyboardStore.pressedNotes.filter((n) => n !== noteWithoutOctave)
			playbackStore.stopNote({ note })
		}
	}

	function handleMouseDown(event: MouseEvent) {
		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		event.preventDefault()
		event.stopPropagation()

		const wasPlayingNote = keyboardStore.mousePlayingNote
		if (wasPlayingNote && wasPlayingNote !== note) {
			const wasPlayingNoteWithoutOctave = wasPlayingNote.replace(/[0-9]/g, '')
			keyboardStore.pressedNotes = keyboardStore.pressedNotes.filter((n) => n !== wasPlayingNoteWithoutOctave)
			playbackStore.stopNote({ note: wasPlayingNote })
		}

		isPressed = true
		keyboardStore.mousePlayingNote = note
		keyboardStore.pressedNotes = [...keyboardStore.pressedNotes, noteWithoutOctave]
		playbackStore.playNote({ note })
	}

	function handleMouseUp(event: MouseEvent) {
		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		event.preventDefault()
		event.stopPropagation()

		const wasPlayingNote = keyboardStore.mousePlayingNote
		if (wasPlayingNote) {
			const wasPlayingNoteWithoutOctave = wasPlayingNote.replace(/[0-9]/g, '')
			keyboardStore.pressedNotes = keyboardStore.pressedNotes.filter((n) => n !== wasPlayingNoteWithoutOctave)
			playbackStore.stopNote({ note: wasPlayingNote })
			keyboardStore.mousePlayingNote = null
		}

		isPressed = false
	}

	function handleMouseEnter(event: MouseEvent) {
		const isMouseDown = event.buttons === 1
		if (!isMouseDown) return

		const wasPlayingNote = keyboardStore.mousePlayingNote
		if (wasPlayingNote && wasPlayingNote !== note) {
			const wasPlayingNoteWithoutOctave = wasPlayingNote.replace(/[0-9]/g, '')
			keyboardStore.pressedNotes = keyboardStore.pressedNotes.filter((n) => n !== wasPlayingNoteWithoutOctave)
			playbackStore.stopNote({ note: wasPlayingNote })
		}

		isPressed = true
		keyboardStore.mousePlayingNote = note
		keyboardStore.pressedNotes = [...keyboardStore.pressedNotes, noteWithoutOctave]
		playbackStore.playNote({ note })
	}

	function handleMouseLeave() {
		if (keyboardStore.mousePlayingNote === note) {
			isPressed = false
		}
	}

	onMount(() => {
		if (browser) {
			window.addEventListener('keydown', handleKeyDown)
			window.addEventListener('keyup', handleKeyUp)
		}
	})

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('keyup', handleKeyUp)
		}
	})
</script>

<div
	class="QwertyKey {keyClassName}"
	style="flex: {config.width}"
	role="button"
	tabindex="0"
	onmousedown={handleMouseDown}
	onmouseup={handleMouseUp}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<span class="qwertyLabel">{config.label.toUpperCase()}</span>
	<span class="noteLabel">{note}</span>
</div>

<style>
	.QwertyKey {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: var(--font-size-2);
		user-select: none;
		transition:
			background var(--motion-instant) linear,
			color var(--motion-instant) linear;
	}

	.normalKey,
	.functionalKey {
		background: var(--card);
		color: var(--foreground);
	}

	.normalKey.pressedKey,
	.functionalKey.pressedKey {
		background: var(--foreground);
		color: var(--background);
		border-color: var(--foreground);
	}

	.sharpKey {
		background: var(--color-neutral-3);
		color: var(--foreground);
	}

	.sharpKey.pressedKey {
		background: var(--foreground);
		color: var(--background);
		border-color: var(--foreground);
	}

	.octaveNotePressed .noteLabel,
	.octaveNotePressed .qwertyLabel {
		color: var(--foreground);
		font-weight: var(--font-weight-semibold);
	}

	.functionalKey.octaveNotePressed .noteLabel {
		font-weight: var(--font-weight-regular);
		color: var(--foreground);
	}

	.pressedKey.octaveNotePressed .noteLabel,
	.pressedKey.octaveNotePressed .qwertyLabel {
		font-weight: var(--font-weight-regular);
		color: var(--background);
	}
</style>
