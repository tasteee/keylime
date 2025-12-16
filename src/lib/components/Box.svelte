<script lang="ts">
	import type { Snippet } from 'svelte'

	type PropsT = {
		children?: Snippet

		// Direction & Flow
		isRow?: boolean // Default
		isColumn?: boolean
		isInline?: boolean // display: inline-flex
		isReverse?: boolean // row-reverse / column-reverse
		isWrapped?: boolean // flex-wrap: wrap

		// Spacing & Alignment
		gap?: string // e.g. "16px", "1rem"
		justify?: string // Controls Horizontal Axis (row=justify-content, col=align-items)
		align?: string // Controls Vertical Axis (row=align-items, col=justify-content)

		// Geometry
		width?: string
		height?: string
		padding?: string
		paddingBottom?: string
		paddingTop?: string
		paddingLeft?: string
		paddingRight?: string
		margin?: string
		marginBottom?: string
		marginTop?: string
		marginLeft?: string
		marginRight?: string

		// Automation
		class?: string
		tag?: string
		style?: string // For one-off overrides
	}

	let {
		children,
		isRow = true, // Default to row if isColumn not specified
		isColumn = false,
		isInline = false,
		isReverse = false,
		isWrapped = false,
		gap = '0px',
		justify = 'flex-start',
		align = 'stretch',
		width,
		height,
		padding,
		class: className = '',
		tag = 'div',
		style = '',
		...props
	}: PropsT = $props()

	// Logic to resolve direction
	let direction = $derived.by(() => {
		if (isColumn) return isReverse ? 'column-reverse' : 'column'
		return isReverse ? 'row-reverse' : 'row'
	})

	const getFlexValue = (value: string) => {
		if (value === 'start') return 'flex-start'
		if (value === 'end') return 'flex-end'
		if (value === 'between') return 'space-between'
		if (value === 'around') return 'space-around'
		if (value === 'evenly') return 'space-evenly'
		return value // return as is for other values like 'center', 'stretch', etc
	}

	// Logic to resolve Alignment based on User's X/Y Mental Model
	// justify -> always horizontal control
	// align -> always vertical control
	let cssJustifyContent = $derived(getFlexValue(isColumn ? align : justify))
	let cssAlignItems = $derived(getFlexValue(isColumn ? justify : align))

	let cssStyles = $derived(
		[
			`display: ${isInline ? 'inline-flex' : 'flex'}`,
			`flex-direction: ${direction}`,
			`flex-wrap: ${isWrapped ? 'wrap' : 'nowrap'}`,
			`gap: ${gap}`,
			`justify-content: ${cssJustifyContent}`,
			`align-items: ${cssAlignItems}`,
			width ? `width: ${width}` : '',
			height ? `height: ${height}` : '',
			padding ? `padding: ${padding}` : '',
			props.paddingBottom ? `padding-bottom: ${props.paddingBottom}` : '',
			props.paddingTop ? `padding-top: ${props.paddingTop}` : '',
			props.paddingLeft ? `padding-left: ${props.paddingLeft}` : '',
			props.paddingRight ? `padding-right: ${props.paddingRight}` : '',
			props.margin ? `margin: ${props.margin}` : '',
			props.marginBottom ? `margin-bottom: ${props.marginBottom}` : '',
			props.marginTop ? `margin-top: ${props.marginTop}` : '',
			props.marginLeft ? `margin-left: ${props.marginLeft}` : '',
			props.marginRight ? `margin-right: ${props.marginRight}` : '',
			style
		]
			.filter(Boolean)
			.join('; ')
	)
</script>

<svelte:element this={tag} class={className} style={cssStyles}>
	{@render children?.()}
</svelte:element>
