<script lang="ts">
	type PropsT = {
		isVertical?: boolean
		spacing?: string // Margin around the divider
		class?: string
	}

	let { isVertical = false, spacing = '16px', class: className = '' }: PropsT = $props()

	function getClasses() {
		return ['divider-base', isVertical ? 'isVertical' : 'isHorizontal', className].filter(Boolean).join(' ')
	}

	// Styles injected via style attribute for dynamic spacing
	let style = $derived(
		isVertical ? `margin: 0 ${spacing}; height: auto; align-self: stretch;` : `margin: ${spacing} 0; width: 100%;`
	)
</script>

<div class={getClasses()} {style} role="separator"></div>

<style>
	.divider-base {
		background: transparent;
		border: none;
		opacity: 0.8;
	}

	.isHorizontal {
		height: 1px;
		border-top: 1px solid rgba(0, 0, 0, 0.06); /* Shadow */
		border-bottom: 1px solid rgba(255, 255, 255, 0.7); /* Highlight */
	}

	.isVertical {
		width: 1px;
		border-left: 1px solid rgba(0, 0, 0, 0.06);
		border-right: 1px solid rgba(255, 255, 255, 0.7);
	}
</style>
