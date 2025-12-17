<script lang="ts">
	type ReplicatedDropdownOptionT = {
		label: string
		value: string
		disabled?: boolean
	}

	type ReplicatedDropdownPropsT = {
		label: string
		options: ReplicatedDropdownOptionT[]
		selectedValue?: string
		disabled?: boolean
		class?: string
		header?: string
		footer?: {
			text: string
			link?: {
				text: string
				href: string
			}
		}
		onSelect?: (value: string) => void
	}

	const props: ReplicatedDropdownPropsT = $props()

	let isOpen = $state(false)

	const toggleDropdown = () => {
		if (props.disabled) return
		isOpen = !isOpen
	}

	const handleSelect = (args: { value: string }) => {
		if (props.disabled) return
		isOpen = false
		if (props.onSelect) {
			props.onSelect(args.value)
		}
	}

	let containerElement: HTMLDivElement | undefined = $state()

	const handleClickOutside = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		if (containerElement && !containerElement.contains(target)) {
			isOpen = false
		}
	}

	$effect(() => {
		if (isOpen) {
			setTimeout(() => {
				document.addEventListener('click', handleClickOutside)
			}, 0)
			return () => {
				document.removeEventListener('click', handleClickOutside)
			}
		}
	})
</script>

<div class="replicated-dropdown-container {props.class ?? ''}" bind:this={containerElement}>
	<button
		type="button"
		class="replicated-dropdown-button"
		disabled={props.disabled}
		onclick={(e) => {
			e.stopPropagation()
			toggleDropdown()
		}}
	>
		{props.label}
		<span class="icon-wrapper">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" class="icon" xmlns="http://www.w3.org/2000/svg">
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M1.247 3.342a1 1 0 011.412-.095L6 6.34l3.342-3.093a1 1 0 111.316 1.506L6.675 8.386a1 1 0 01-1.348 0L1.342 4.753a1 1 0 01-.095-1.411z"
				></path>
			</svg>
		</span>
	</button>

	{#if isOpen}
		<div class="replicated-dropdown-menu">
			<ul class="menu-list">
				{#if props.header}
					<div class="menu-header">
						<p class="header-text">{props.header}</p>
					</div>
				{/if}

				{#each props.options as option}
					<button
						type="button"
						class="menu-item"
						class:selected={props.selectedValue === option.value}
						disabled={option.disabled}
						onclick={() => handleSelect({ value: option.value })}
					>
						{option.label}
					</button>
				{/each}
				{#if props.footer}
					<hr class="menu-divider" />
					<div class="menu-footer">
						<p class="footer-text">{props.footer.text}</p>
						{#if props.footer.link}
							<a href={props.footer.link.href} target="_blank" rel="noreferrer" class="footer-link">
								{props.footer.link.text}
							</a>
						{/if}
					</div>
				{/if}
			</ul>
		</div>
	{/if}
</div>

<style>
	.replicated-dropdown-container {
		position: relative;
		display: inline-block;
	}

	.replicated-dropdown-button {
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
		padding-left: 16px;
		padding-right: 16px;
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

	.replicated-dropdown-button:hover:not(:disabled) {
		background-color: rgb(248, 247, 254);
	}

	.replicated-dropdown-button:active:not(:disabled) {
		background-color: rgb(241, 239, 250);
		transform: translateY(1px);
	}

	.replicated-dropdown-button:focus:not(:disabled) {
		outline: 2px solid rgb(147, 140, 184);
		outline-offset: 2px;
	}

	.replicated-dropdown-button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.icon-wrapper {
		block-size: 12px;
		color: rgb(96, 93, 107);
		cursor: pointer;
		display: flex;
		font-size: 14px;
		font-weight: 700;
		height: 12px;
		inline-size: 12px;
		line-height: 20px;
		margin-inline-start: 8px;
		margin-left: 8px;
		outline-color: rgb(96, 93, 107);
		text-align: center;
		width: 12px;
	}

	:global(.icon-wrapper .icon) {
		block-size: 12px;
		color: rgb(96, 93, 107);
		cursor: pointer;
		display: block;
		fill: rgb(96, 93, 107);
		font-size: 14px;
		font-weight: 700;
		height: 12px;
		inline-size: 12px;
		line-height: 20px;
		outline-color: rgb(96, 93, 107);
		overflow: hidden;
		text-align: center;
		width: 12px;
	}

	:global(.replicated-dropdown-button:disabled .icon) {
		color: rgb(172, 170, 181);
		fill: rgb(172, 170, 181);
	}

	.replicated-dropdown-menu {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		background-color: rgb(255, 255, 255);
		border: 1px solid rgb(227, 225, 233);
		border-radius: 12px;
		box-shadow:
			rgba(28, 26, 39, 0.08) 0px 6px 8px 0px,
			rgba(28, 26, 39, 0.1) 0px 3px 4px 0px,
			rgba(28, 26, 39, 0.16) 0px 0px 1px 0px;
		max-height: calc(100vh - 32px);
		max-width: calc(100vw - 32px);
		min-height: 16px;
		min-width: 16px;
		overflow-x: hidden;
		overflow-y: auto;
		padding: 16px;
		z-index: 1000;
		animation: fadeIn 0.225s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.menu-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		list-style-type: none;
		margin: 0;
		padding: 0;
	}

	.menu-header {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px;
	}

	.header-text {
		color: rgb(28, 27, 31);
		font-size: 14px;
		font-weight: 600;
		line-height: 20px;
		margin: 0;
	}

	.menu-item {
		align-items: center;
		appearance: none;
		background-color: transparent;
		border: none;
		border-radius: 6px;
		color: rgb(28, 27, 31);
		cursor: pointer;
		display: flex;
		font-size: 14px;
		gap: 8px;
		line-height: 20px;
		padding: 4px 8px;
		text-align: left;
		transition: background-color 0.08s ease-out;
		width: 100%;
	}

	.menu-item:hover:not(:disabled) {
		background-color: rgb(248, 247, 254);
	}

	.menu-item.selected {
		background-color: rgb(221, 225, 255);
		color: rgb(87, 60, 250);
	}

	.menu-item:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.menu-divider {
		background-color: rgb(227, 225, 233);
		border: none;
		height: 1px;
		margin: 0 -16px;
	}

	.menu-footer {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 8px;
	}

	.footer-text {
		color: rgb(49, 47, 55);
		font-size: 12px;
		line-height: 16px;
		margin: 0;
	}

	.footer-link {
		color: rgb(108, 104, 119);
		cursor: pointer;
		display: block;
		font-size: 12px;
		line-height: 16px;
		text-decoration: none;
		transition: color 0.08s ease-out;
	}

	.footer-link:hover {
		color: rgb(87, 60, 250);
	}
</style>
