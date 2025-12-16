<script lang="ts">
	type PropsT = {
		checked: boolean

		// Configuration
		size?: 'small' | 'medium'

		// States
		isDisabled?: boolean

		// Automation
		onchange?: (checked: boolean) => void
		class?: string
		id?: string
		label?: string // Helper for accessibility
	}

	let {
		checked = $bindable(),
		size = 'medium',
		isDisabled = false,
		onchange,
		class: className = '',
		id,
		label
	}: PropsT = $props()

	function toggle() {
		if (isDisabled) return
		checked = !checked
		onchange?.(checked)
	}
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={label}
	{id}
	disabled={isDisabled}
	class="switch-track {checked ? 'isChecked' : ''} {size === 'small' ? 'isSmallSize' : 'isMediumSize'} {className}"
	onclick={toggle}
>
	<div class="switch-thumb"></div>
</button>

<style>
	.switch-track {
		appearance: none;
		border: none;
		background: var(--color-surface-dim);
		box-shadow: var(--shadow-inner-md); /* Recessed track */
		border-radius: var(--radius-full);
		cursor: pointer;
		position: relative;
		transition:
			background 0.2s ease,
			box-shadow 0.2s ease;
		display: inline-flex;
		align-items: center;
		padding: 2px;
	}

	.switch-thumb {
		background: white;
		border-radius: 50%;
		box-shadow:
			0px 2px 4px rgba(0, 0, 0, 0.1),
			inset 0px -1px 1px rgba(0, 0, 0, 0.05);
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Sizes */
	.isMediumSize {
		width: 48px;
		height: 28px;
	}
	.isMediumSize .switch-thumb {
		width: 24px;
		height: 24px;
	}

	.isSmallSize {
		width: 36px;
		height: 20px;
	}
	.isSmallSize .switch-thumb {
		width: 16px;
		height: 16px;
	}

	/* Checked State */
	.isChecked {
		background: var(--color-accent-primary);
		box-shadow: inset 0px 2px 4px rgba(0, 0, 0, 0.1);
	}

	.isChecked.isMediumSize .switch-thumb {
		transform: translateX(20px);
	}
	.isChecked.isSmallSize .switch-thumb {
		transform: translateX(16px);
	}

	/* Disabled */
	.switch-track:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
