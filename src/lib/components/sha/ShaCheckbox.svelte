<script lang="ts">
	import { Check } from 'phosphor-svelte'

	type PropsT = {
		checked: boolean
		label?: string // Text to display next to it
		isDisabled?: boolean
		onchange?: (checked: boolean) => void
		class?: string
	}

	let { checked = $bindable(), label, isDisabled = false, onchange, class: className = '' }: PropsT = $props()

	function toggle() {
		if (!isDisabled) {
			checked = !checked
			onchange?.(checked)
		}
	}
</script>

<div class="checkbox-container {isDisabled ? 'isDisabled' : ''} {className}">
	<button
		type="button"
		role="checkbox"
		aria-checked={checked}
		class="checkbox-box {checked ? 'isChecked' : ''}"
		onclick={toggle}
	>
		{#if checked}
			<Check weight="bold" size={12} color="white" />
		{/if}
	</button>

	{#if label}
		<span class="label-text" onclick={toggle}>{label}</span>
	{/if}
</div>

<style>
	.checkbox-container {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		user-select: none;
	}

	.checkbox-box {
		width: 20px;
		height: 20px;
		border-radius: 5px; /* Soft square */
		border: none;

		/* Unchecked: Recessed Look */
		background: var(--color-surface-dim);
		box-shadow: var(--shadow-inner-sm);

		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	/* Checked: Popped & Colored */
	.isChecked {
		background: var(--a);
		box-shadow: 0px 2px 4px rgba(102, 126, 234, 0.3);
	}

	.label-text {
		font-size: 14px;
		color: var(--color-text-secondary);
	}

	.isDisabled {
		opacity: 0.6;
		pointer-events: none;
	}
</style>
