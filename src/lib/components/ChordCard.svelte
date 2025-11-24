<script lang="ts">
	import * as Item from '$lib/components/ui/item'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { progressionStore } from '$lib/stores/progression.svelte'
	import playbackStore from '$lib/stores/playback.svelte'
	import { generate, applyVoicingAndInversion } from '$lib/helpers/chords'
	import ChordModifier from './ChordModifier.svelte'
	import { Note } from 'tonal'

	type ChordCardPropsT = {
		chordName: string
	}

	const props: ChordCardPropsT = $props()

	// Generate the complex ChordT object from the chord name
	const baseChord = $derived(generate(props.chordName))

	// Local state for chord modifiers
	let octaveOffset = $state(0)
	let inversion = $state(0)
	let voicing = $state<VoicingT>('closed')
	let minVelocity = $state(60)
	let maxVelocity = $state(75)

	// Derived chord with modifiers applied
	const chord = $derived.by(() => {
		let modifiedChord = { ...baseChord }

		// Apply voicing and inversion
		modifiedChord = applyVoicingAndInversion({
			chord: modifiedChord,
			voicing: voicing,
			inversion: inversion
		})

		// Apply octave offset by transposing all notes
		if (octaveOffset !== 0) {
			const interval = octaveOffset > 0 ? `${octaveOffset * 7 + 1}P` : `-${Math.abs(octaveOffset) * 7 + 1}P`
			modifiedChord.notes = modifiedChord.notes.map((note) => Note.transpose(note, interval))
			modifiedChord.bassNote = Note.transpose(modifiedChord.bassNote, interval)
		}

		// Apply velocity
		modifiedChord.minVelocity = minVelocity
		modifiedChord.maxVelocity = maxVelocity
		modifiedChord.octaveOffset = octaveOffset
		modifiedChord.inversion = inversion
		modifiedChord.voicing = voicing

		return modifiedChord
	})

	const onOctaveOffsetChange = (value: number) => {
		octaveOffset = value
	}

	const onInversionChange = (value: number) => {
		inversion = value
	}

	const onVoicingChange = (value: VoicingT) => {
		voicing = value
	}

	const onMinVelocityChange = (value: number) => {
		minVelocity = value
	}

	const onMaxVelocityChange = (value: number) => {
		maxVelocity = value
	}

	const addChordToProgression = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()

		// Create a new chord instance with modifiers applied
		const chordToAdd: ChordT = {
			...chord,
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

		// Play each note in the chord
		chord.notes.forEach((note) => {
			playbackStore.play({ note })
		})
	}

	const onMouseUp = (event: MouseEvent) => {
		const isLeftButton = event.button === 0
		if (!isLeftButton) return

		event.preventDefault()
		event.stopPropagation()

		// Stop each note in the chord
		chord.notes.forEach((note) => {
			playbackStore.stop({ note })
		})
	}

	const onMouseLeave = () => {
		// Stop all notes when mouse leaves while pressed
		chord.notes.forEach((note) => {
			playbackStore.stop({ note })
		})
	}
</script>

<ChordModifier
	{octaveOffset}
	{inversion}
	{voicing}
	{minVelocity}
	{maxVelocity}
	{onOctaveOffsetChange}
	{onInversionChange}
	{onVoicingChange}
	{onMinVelocityChange}
	{onMaxVelocityChange}
>
	{#snippet children()}
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
				<Item.Title>{chord.symbol}</Item.Title>
				<!-- <Item.Description class="text-xs font-mono">{chord.notes.join(' ')}</Item.Description> -->
			</Item.Content>
			<Item.Actions>
				<Button variant="outline" size="sm" onclick={addChordToProgression}>
					<Icon icon="mingcute:add-line" class="size-3" />
				</Button>
			</Item.Actions>
		</Item.Root>
	{/snippet}
</ChordModifier>
