<script lang="ts">
	import type { Snippet } from 'svelte'

	type ReplicatedButtonPropsT = {
		label?: string
		icon?: Snippet
		iconAfter?: boolean
		disabled?: boolean
		class?: string
	}

	// NEVER DESTRUCTURE PROPS EVER!
	const props: ReplicatedButtonPropsT = $props()
</script>

<button type="button" class="replicated-button {props.class ?? ''}" disabled={props.disabled}>
	{#if props.icon && !props.iconAfter}
		<span class="icon-wrapper">
			{@render props.icon()}
		</span>
	{/if}
	{props.label}
	{#if props.icon && props.iconAfter}
		<span class="icon-wrapper">
			{@render props.icon()}
		</span>
	{/if}
</button>

<style>
	.replicated-button {
		align-items: center;
		appearance: none;
		background-color: rgb(255, 255, 255);
		block-size: 28px;
		border: none;
		border-radius: 8px;
		box-shadow:
			rgba(28, 26, 39, 0.12) 0px 1px 2px 0px,
			rgba(28, 26, 39, 0.16) 0px 0px 1px 0px;
		caret-color: rgb(28, 27, 31);
		color: rgb(28, 27, 31);
		cursor: pointer;
		display: flex;
		font-size: 14px;
		font-weight: 700;
		height: 28px;
		justify-content: center;
		line-height: 20px;
		outline-color: rgb(28, 27, 31);
		padding-bottom: 4px;
		padding-right: 12px;
		padding-top: 4px;
		text-decoration-color: rgb(28, 27, 31);
		text-emphasis-color: rgb(28, 27, 31);
		transition-duration: 0.08s;
		transition-timing-function: ease-out;
		-webkit-box-align: center;
		-webkit-box-pack: center;
		-webkit-text-fill-color: rgb(28, 27, 31);
		-webkit-text-stroke-color: rgb(28, 27, 31);
	}

	.replicated-button:hover:not(:disabled) {
		background-color: rgb(248, 247, 254);
	}

	.replicated-button:active:not(:disabled) {
		background-color: rgb(241, 239, 250);
		transform: translateY(1px);
	}

	/* .replicated-button:focus:not(:disabled) {
		outline: 2px solid rgb(147, 140, 184);
		outline-offset: 2px;
	} */

	.replicated-button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.icon-wrapper {
		block-size: 16px;
		color: rgb(96, 93, 107);
		cursor: pointer;
		display: flex;
		font-size: 14px;
		font-weight: 700;
		height: 16px;
		inline-size: 16px;
		line-height: 20px;
		outline-color: rgb(96, 93, 107);
		text-align: center;
		width: 16px;
	}

	button:not([disabled]) .icon-wrapper:first-child {
		margin-inline-end: 8px;
		margin-right: 8px;
	}

	button:not([disabled]) .icon-wrapper:last-child {
		margin-inline-start: 8px;
		margin-left: 8px;
	}

	:global(.icon-wrapper .icon) {
		block-size: 16px;
		color: rgb(96, 93, 107);
		cursor: pointer;
		display: block;
		font-size: 14px;
		font-weight: 700;
		height: 16px;
		inline-size: 16px;
		line-height: 20px;
		outline-color: rgb(96, 93, 107);
		overflow: hidden;
		stroke: rgb(96, 93, 107);
		text-align: center;
		width: 16px;
	}

	:global(.icon-wrapper .icon path) {
		color: rgb(96, 93, 107);
		cursor: pointer;
		font-size: 14px;
		font-weight: 700;
		line-height: 20px;
		outline-color: rgb(96, 93, 107);
		stroke: rgb(96, 93, 107);
		stroke-linecap: round;
		stroke-width: 2px;
		text-align: center;
	}

	:global(.icon-wrapper .icon[fill='currentColor']) {
		fill: rgb(96, 93, 107);
	}

	:global(.replicated-button:disabled .icon),
	:global(.replicated-button:disabled .icon path) {
		color: rgb(172, 170, 181);
		fill: rgb(172, 170, 181);
		stroke: rgb(172, 170, 181);
	}
</style>
