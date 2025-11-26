<script lang="ts">
	import * as Item from '$lib/components/ui/item'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import { chordModifierStore } from '$lib/stores/chordModifier.svelte'
	import { applyVoicingAndInversion } from '$lib/helpers/chords'
	import { Note } from 'tonal'

	type ChordCardPropsT = {
		chord: ChordT
	}

	const props: ChordCardPropsT = $props()

	// Apply modifiers to the chord for display and playback
	const modifiedChord = $derived.by(() => {
		let chord = props.chord

		// Apply voicing and inversion
		chord = applyVoicingAndInversion({
			chord,
			voicing: props.chord.voicing as VoicingT,
			inversion: props.chord.inversion
		})

		// Apply octave offset
		const octaveOffset = props.chord.octaveOffset
		if (octaveOffset !== 0) {
			const interval = octaveOffset > 0 ? `${octaveOffset * 7 + 1}P` : `-${Math.abs(octaveOffset) * 7 + 1}P`
			chord = {
				...chord,
				notes: chord.notes.map((note) => Note.transpose(note, interval)),
				bassNote: Note.transpose(chord.bassNote, interval)
			}
		}

		return chord
	})

	const handleContextMenu = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		chordModifierStore.openForGridChord({
			chordId: props.chord.id
		})
	}

	const addChordToProgression = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()

		// Create a new chord instance for the progression
		const chordToAdd: ChordT = {
			...modifiedChord,
			id: crypto.randomUUID()
		}

		progressionStore.addChord(chordToAdd)
	}

	const onMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		if (target.closest('button')) return
		const isLeftButton = event.button === 0
		if (!isLeftButton) return
		event.preventDefault()
		event.stopPropagation()
		playbackStore.playChord(modifiedChord.notes)
	}

	const onMouseUp = (event: MouseEvent) => {
		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		event.preventDefault()
		event.stopPropagation()

		// Stop each note in the chord
		modifiedChord.notes.forEach((note) => {
			playbackStore.stopNote({ note })
		})
	}

	const onMouseLeave = () => {
		// Stop all notes when mouse leaves while pressed
		modifiedChord.notes.forEach((note) => {
			playbackStore.stopNote({ note })
		})
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div oncontextmenu={handleContextMenu}>
	<Item.Root
		variant="outline"
		onmousedown={onMouseDown}
		onmouseup={onMouseUp}
		onmouseleave={onMouseLeave}
		role="button"
		tabindex={0}
		class="cursor-pointer select-none"
	>
		<Item.Content>
			<Item.Title>{modifiedChord.symbol}</Item.Title>
		</Item.Content>
		<Item.Actions>
			<Button variant="outline" size="sm" onclick={addChordToProgression}>
				<Icon icon="mingcute:add-line" class="size-3" />
			</Button>
		</Item.Actions>
	</Item.Root>
</div>
