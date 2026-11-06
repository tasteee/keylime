<script lang="ts">
	import output from '$lib/stores/output.svelte'

	const isChordMode = $derived(output.chordPreviewMode === 'chord')
	const isPatternMode = $derived(output.chordPreviewMode === 'pattern')

	const handleChordPress = () => {
		output.chordPreviewMode = 'chord'
	}

	const handlePatternPress = () => {
		output.chordPreviewMode = 'pattern'
	}

	$effect(() => {
		// Persist to localStorage. output.svelte.ts reads it back first.
		localStorage.setItem('output.chordPreviewMode', JSON.stringify(output.chordPreviewMode))
	})
</script>

<z-row gap="xs" alignsY="center">
	<z-text size="xs" color="muted" weight={600} class="control-label">Preview</z-text>
	<z-toggle-button-group size="sm" kind="outline">
		<z-toggle-button-group-item value="chord" isPressed={isChordMode} onpress={handleChordPress}>Chord</z-toggle-button-group-item>
		<z-toggle-button-group-item value="pattern" isPressed={isPatternMode} onpress={handlePatternPress}>Pattern</z-toggle-button-group-item>
	</z-toggle-button-group>
</z-row>

<style>
	.control-label {
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
</style>
