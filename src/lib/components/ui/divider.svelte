<script lang="ts">
	type PropsT = {
		isThin?: boolean
		isHorizontal?: boolean
		margin?: string // left right if vertical, top bottom if horizontal
		class?: string
	}

	let props: PropsT = $props()

	const classes = $derived.by(() => {
		const directionClass = props.isHorizontal ? 'isHorizontal' : 'isVertical'
		const propsClass = props.class ?? ''
		const thinClass = props.isThin ? 'isThin' : ''
		return `Divider ${directionClass} ${propsClass} ${thinClass}`.trim()
	})

	// Styles injected via style attribute for dynamic spacing
	let style = $derived(
		props.isHorizontal
			? `margin: ${props.margin} 0; width: 100%;`
			: `margin: 0 ${props.margin}; height: auto; align-self: stretch;`
	)
</script>

<div class={classes} {style} role="separator"></div>

<style>
	.Divider {
		background: var(--n-04);
		border: none;
		opacity: 0.8;
	}

	.Divider.isHorizontal {
		height: 1px;
		border-top: 1px solid rgb(209, 213, 219); /* Shadow */
		border-bottom: 1px solid rgba(255, 255, 255, 0.7); /* Highlight */
	}

	.Divider.isVertical {
		width: 1px;
		border-left: 1px solid rgb(209, 213, 219);
		border-right: 1px solid rgba(255, 255, 255, 0.7);
	}

	.Divider.isVertical.isThin {
		border-right: none;
	}

	.Divider.isHorizontal.isThin {
		border-bottom: none;
	}
</style>
