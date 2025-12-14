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
		<div class="logo">
			<div class="logo-icon">
				<Icon icon="mingcute:lemon-line" class="size-5" />
			</div>
			<span class="logo-text">KEYLIME</span>
		</div>

		<div class="divider"></div>

		<nav class="nav">
			<Button
				variant={activeView === 'chords' ? 'secondary' : 'ghost'}
				size="sm"
				class="nav-btn"
				onclick={() => (activeView = 'chords')}
			>
				<Icon icon="mingcute:grid-line" class="mr-2 size-4" />
				Chords
			</Button>
			<Button
				variant={activeView === 'patterns' ? 'secondary' : 'ghost'}
				size="sm"
				class="nav-btn"
				onclick={() => (activeView = 'patterns')}
			>
				<Icon icon="mingcute:music-2-line" class="mr-2 size-4" />
				Patterns
			</Button>
		</nav>
	</div>

	<div class="center">
		<div class="controls-group">
			<SelectKey />
			<SelectScale />
			<SelectOctave />
		</div>
	</div>

	<div class="right">
		<!-- Placeholder for future right-aligned items like settings or user profile -->
	</div>
</div>

<style>
	.TopBar {
		position: relative;
		width: 100%;
		height: var(--topbar-height);
		padding: 0 32px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--bar-bg);
		border-bottom: var(--border-thick);
		z-index: 50;
		gap: 32px;
		box-shadow: var(--bar-shadow);
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

	.logo-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--color-pop-pink);
		color: var(--color-ink);
		border-radius: 999px;
		border: 3px solid var(--color-ink);
		box-shadow: 2px 2px 0px var(--color-ink);
	}

	.logo-text {
		font-family: var(--font-display);
		font-size: 24px;
		transform: rotate(-2deg);
	}

	.logo-text {
		font-weight: 800;
		font-size: 20px;
		letter-spacing: -0.03em;
		background: linear-gradient(to right, var(--foreground), var(--muted-foreground));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
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
		background-color: var(--secondary);
		padding: 4px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}

	.center {
		display: flex;
		align-items: center;
		gap: 16px;
		flex: 1;
		justify-content: center;
	}

	.controls-group {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		background-color: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
	}

	.right {
		display: flex;
		align-items: center;
		gap: 16px;
	}
</style>
