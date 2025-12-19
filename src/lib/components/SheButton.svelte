<script lang="ts">
	import { Button } from 'bits-ui'

	type PropsT = {
		onclick?: () => void
		label?: string
		color?: 'default' | 'danger'
		kind?: 'ghost' | 'outline' | 'solid'
		size?: 'small' | 'medium' | 'large'
		isDisabled?: boolean
		isLoading?: boolean
	}

	const props: PropsT = $props()

	const classNames = $derived.by(() => {
		const isNeutralColor = props.color === 'default' || !props.color
		const isDangerColor = props.color === 'danger'
		const isGhostKind = props.kind === 'ghost'
		const isOutlineKind = props.kind === 'outline'
		const isSolidKind = props.kind === 'solid' || !props.kind
		const isSmallSize = props.size === 'small'
		const isMediumSize = props.size === 'medium' || !props.size
		const isLargeSize = props.size === 'large'

		return [
			isNeutralColor ? 'isNeutralColor' : '',
			isDangerColor ? 'isDangerColor' : '',
			isGhostKind ? 'isGhostKind' : '',
			isOutlineKind ? 'isOutlineKind' : '',
			isSolidKind ? 'isSolidKind' : '',
			isSmallSize ? 'isSmallSize' : '',
			isMediumSize ? 'isMediumSize' : '',
			isLargeSize ? 'isLargeSize' : ''
		]
			.filter(Boolean)
			.join(' ')
	})
</script>

<Button.Root class="SheButton {classNames}" onclick={props.onclick}>{props.label}</Button.Root>

<style>
	.SheButton {
		background: #4b5563;
		color: var(--n-00);
		font-size: 12px;
		letter-spacing: 0.5px;
		font-weight: 600;
		padding: 0px 8px;
		height: 36px;
		border-radius: 5px;
	}

	/* colors: neutral, danger */
	/* kinds: ghost, outline, solid */
	/* sizes: small, medium, large */
	/* states: disabled, loading */

	.isDisabled {
		opacity: 0.6;
		pointer-events: none;
		cursor: not-allowed;
	}

	.isLoading {
		pointer-events: none;
		cursor: progress;
	}

	.isSmallSize {
	}
	.isMediumSize {
	}
	.isLargeSize {
	}

	.isNeutralColor {
	}
	.isDangerColor {
	}

	.isGhostKind {
	}
	.isOutlineKind {
	}
	.isSolidKind {
	}
</style>
