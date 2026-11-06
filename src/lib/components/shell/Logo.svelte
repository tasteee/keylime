<script lang="ts">
	import { OrangeSlice } from 'phosphor-svelte'
	import { buildHref } from '$lib/modules/navigate'

	type LogoPropsT = {
		size?: 'sm' | 'md' | 'lg'
		// Set false to show only the icon.
		hasWordmark?: boolean
	}

	const props: LogoPropsT = $props()

	const logoSize = $derived(props.size ?? 'md')
	const iconSizeByLogoSize = { sm: 20, md: 24, lg: 32 }
	const iconSize = $derived(iconSizeByLogoSize[logoSize])
	const shouldShowWordmark = $derived(props.hasWordmark ?? true)
	const homeHref = buildHref('/dashboard')
</script>

<a class="logo isSize{logoSize}" href={homeHref} aria-label="Keylime home">
	<OrangeSlice size={iconSize} weight="fill" />
	{#if shouldShowWordmark}
		<span class="logoWordmark">KEYLIME</span>
	{/if}
</a>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--foreground);
		text-decoration: none;
		font-family: 'Saira Variable', var(--font-sans);
		font-weight: 900;
		letter-spacing: 0.02em;
	}

	.logo.isSizesm {
		font-size: var(--font-size-3);
	}

	.logo.isSizemd {
		font-size: var(--font-size-5);
	}

	.logo.isSizelg {
		font-size: var(--font-size-7);
	}

	.logo :global(svg) {
		color: var(--pink);
	}
</style>
