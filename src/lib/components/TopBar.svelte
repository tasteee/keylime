<script lang="ts">
	import SelectKey from '$lib/components/SelectKey.svelte'
	import SelectOctave from '$lib/components/SelectOctave.svelte'
	import SelectScale from '$lib/components/SelectScale.svelte'
	import SelectKeymap from '$lib/components/SelectKeymap.svelte'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'

	let { activeView = $bindable() } = $props()
</script>

<div class="TopBar">
	<div class="left">
		<a href="/" class="logo">
			<!-- <div class="logo-icon">
				<Icon icon="mingcute:lemon-squeezy-fill" class="size-5" />
			</div> -->
			<span class="logo-text">KEYLIME</span>
		</a>

		<div class="divider"></div>

		<nav class="nav">
			<Button kind={activeView === 'chords' ? 'solid' : 'outline'} size="small" onclick={() => (activeView = 'chords')}>
				<Icon icon="mingcute:grid-line" class="mr-2 size-4" />
				Chords
			</Button>
			<Button kind={activeView === 'pattern' ? 'solid' : 'outline'} size="small" onclick={() => (activeView = 'pattern')}>
				<Icon icon="mingcute:music-2-line" class="mr-2 size-4" />
				Pattern
			</Button>
		</nav>
	</div>
</div>

<style>
	.TopBar {
		position: relative;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		z-index: 50;
		gap: 32px;

		/* User Styles */
		background-color: var(--colorWhite);
		border: 1px solid var(--neutral-separatorSubtle);
		/* box-shadow: var(--shadow-s5); */
		height: 64px;
		/* border-radius: 16px; */
		transition: 120ms ease-in;
		width: 100%;
		margin-left: auto;
		margin-right: auto;
		padding-left: 16px;
		padding-right: 16px;
	}

	.left {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--foreground);
		text-decoration: none;
	}

	.logo-text {
		font-family: var(--font-display);
		font-weight: 900;
		font-size: 28px;
		letter-spacing: 1px;
		color: var(--color-n6);
	}

	.divider {
		width: 1px;
		height: 32px;
		background-color: var(--border);
		opacity: 0.5;
	}

	.nav {
		display: flex;
		gap: 4px;
		padding: 4px;
		background-color: var(--n-01);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}
</style>
