<script lang="ts">
	type PropsT = {
		value: number
		min?: number
		max?: number
		step?: number

		// Automation
		onchange?: (value: number) => void // Triggered on release
		oninput?: (value: number) => void // Triggered while dragging
		isDisabled?: boolean
		class?: string
		id?: string
	}

	let {
		value = $bindable(), // Svelte 5 bindable
		min = 0,
		max = 100,
		step = 1,
		onchange,
		oninput,
		isDisabled = false,
		class: className = '',
		id
	}: PropsT = $props()

	function handleInput(e: Event) {
		const v = (e.target as HTMLInputElement).valueAsNumber
		value = v
		oninput?.(v)
	}

	function handleChange(e: Event) {
		const v = (e.target as HTMLInputElement).valueAsNumber
		onchange?.(v)
	}

	// Calculate percentage for CSS background gradient (fill effect)
	let percent = $derived(((value - min) / (max - min)) * 100)
</script>

<div class="slider-container {isDisabled ? 'isDisabled' : ''} {className}">
	<input
		type="range"
		{min}
		{max}
		{step}
		{value}
		{id}
		disabled={isDisabled}
		oninput={handleInput}
		onchange={handleChange}
		style="--progress: {percent}%"
	/>
</div>

<style>
	.slider-container {
		width: 100%;
		height: 32px; /* Touch target size */
		display: flex;
		align-items: center;
		position: relative;
	}

	input[type='range'] {
		-webkit-appearance: none;
		width: 100%;
		background: transparent;
		cursor: pointer;
		margin: 0;
	}

	input[type='range']:focus {
		outline: none;
	}

	/* ------------------------
     THE TRACK
  ------------------------- */
	/* Shared Track Styles */
	/* We use a gradient to simulate the "Filled" part of the slider */
	input[type='range']::-webkit-slider-runnable-track {
		width: 100%;
		height: 8px;
		border-radius: var(--radius-full);

		/* The "Inner Shadow" Recessed Look for the empty track */
		box-shadow: var(--shadow-inner-md);

		/* Background tricks: Linear Gradient from Primary to Primary (fill) + Grey (empty) */
		background: linear-gradient(
			90deg,
			var(--color-accent-primary) 0%,
			var(--color-accent-primary) var(--progress),
			var(--color-surface-dim) var(--progress),
			var(--color-surface-dim) 100%
		);
	}

	/* Firefox Support */
	input[type='range']::-moz-range-track {
		width: 100%;
		height: 8px;
		border-radius: var(--radius-full);
		box-shadow: var(--shadow-inner-md);
		background: linear-gradient(
			90deg,
			var(--color-accent-primary) 0%,
			var(--color-accent-primary) var(--progress),
			var(--color-surface-dim) var(--progress),
			var(--color-surface-dim) 100%
		);
	}

	/* ------------------------
     THE THUMB (Knob)
  ------------------------- */
	/* Shared Thumb Styles: White, Floating, Subtle Border */
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #ffffff;

		/* Center vertically on track */
		margin-top: -6px;

		/* Physical feel shadows */
		box-shadow:
			0px 2px 4px rgba(0, 0, 0, 0.1),
			0px 1px 2px rgba(0, 0, 0, 0.1),
			inset 0px 0px 0px 1px white; /* Pure white ring */

		border: 1px solid rgba(0, 0, 0, 0.05); /* Definition */
		transition:
			transform 0.1s ease,
			box-shadow 0.1s ease;
	}

	input[type='range']::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border: 1px solid rgba(0, 0, 0, 0.05);
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
	}

	/* ------------------------
     INTERACTIONS
  ------------------------- */
	/* Hover: Slightly larger thumb */
	input[type='range']:not(:disabled)::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);
	}

	/* Active/Dragging: Glow effect */
	input[type='range']:not(:disabled):active::-webkit-slider-thumb {
		transform: scale(1.15);
		background: var(--color-surface-base);
		box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2); /* Focus ring */
		border-color: var(--color-accent-primary);
	}

	/* Disabled State */
	.isDisabled {
		opacity: 0.5;
		pointer-events: none;
	}
</style>
