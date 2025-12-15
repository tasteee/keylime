<script lang="ts">
	type Props = {
		direction?: 'horizontal' | 'vertical'
		thickness?: string
		class?: string
		height?: string
		width?: string
		margin?: string
	}

	const props: Props = $props()
	const direction = props.direction || 'vertical'
	const marginStyle = direction === 'vertical' ? `0 ${props.margin || '8px'}` : `${props.margin || '8px'} 0`
</script>

<span
	class="herDivider {direction || 'horizontal'} {props.class || ''}"
	style="height: {props.height || (direction === 'vertical' ? '20px' : props.thickness || '3px')}; width: {props.width ||
		(direction === 'vertical' ? props.thickness || '3px' : '100%')}; margin: {marginStyle}"
></span>

<style>
	.herDivider {
		background-color: #d9d9d9;
		opacity: 1;
	}

	.herDivider.horizontal {
		height: 3px;
		width: 100%;
	}

	.herDivider.vertical {
		width: 3px;
		height: 20px;
	}
</style>
