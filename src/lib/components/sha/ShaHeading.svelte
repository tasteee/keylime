<script lang="ts">
	import type { Snippet } from 'svelte'

	type PropsT = {
		children: Snippet

		// Configuration
		tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
		size?: 'small' | 'medium' | 'large' | 'display'
		align?: 'left' | 'center' | 'right'
		weight?: 'normal' | 'bold'

		// States
		isMuted?: boolean // For subtitles

		// Automation
		class?: string
		id?: string
	}

	let {
		children,
		tag = 'h2',
		size = 'medium',
		align = 'left',
		isMuted = false,
		class: className = '',
		id
	}: PropsT = $props()

	function getClasses() {
		const weightClass = size === 'small' ? 'font-semibold' : 'font-bold'
		const sizeClass =
			size === 'display' ? 'text-4xl' : size === 'large' ? 'text-2xl' : size === 'medium' ? 'text-xl' : 'text-base'

		const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'

		const mutedClass = isMuted ? 'text-gray-500' : 'text-gray-900'
		const baseClasses = 'font-sans leading-tight tracking-tight'
		return [baseClasses, sizeClass, weightClass, alignClass, mutedClass, className].filter(Boolean).join(' ')
	}
</script>

<svelte:element this={tag} class={getClasses()} {id}>
	{@render children()}
</svelte:element>

<style>
	.heading-base {
		font-family: var(--font-sans);
		font-weight: 700;
		line-height: 1.2;
		color: var(--color-text-primary);
		margin: 0;
		letter-spacing: -0.02em; /* Tight tracking for modern feel */
	}

	/* Sizes */
	.isDisplaySize {
		font-size: var(--font-size-2xl);
		font-weight: 800;
	}
	.isLargeSize {
		font-size: var(--font-size-xl);
	}
	.isMediumSize {
		font-size: var(--font-size-lg);
	}

	/* Default H2/H3 feel */
	.isSmallSize {
		font-size: var(--font-size-base);
		font-weight: 600;
	}

	/* Alignments */
	.isCentered {
		text-align: center;
	}
	.isRightAligned {
		text-align: right;
	}

	/* States */
	.isMuted {
		color: var(--color-text-tertiary);
	}
</style>
