<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'
	import { fade } from 'svelte/transition'

	let { data } = $props()

	const handleGoToLogin = () => {
		goto('/auth/login')
	}

	const handleGoToSignup = () => {
		goto('/auth/signup')
	}

	onMount(() => {
		const isAuthenticated = data.isAuthenticated
		if (isAuthenticated) {
			goto('/dashboard')
		} else {
			goto('/login')
		}
	})
</script>

<div class="splash-container" in:fade>
	<header class="splash-header">
		<div class="logo">
			<span class="logo">KEYLIME</span>
		</div>
		<div class="header-actions">
			<Button kind="ghost" onclick={handleGoToLogin}>Log In</Button>
			<Button onclick={handleGoToSignup}>Sign Up</Button>
		</div>
	</header>

	<main class="splash-main">
		<section class="hero">
			<h1 class="hero-title">
				Create music with<br />
				<span class="gradient-text">chord progressions</span>
			</h1>
			<p class="hero-subtitle">
				A powerful, intuitive tool for musicians to compose, collaborate, and share chord progressions. Build your next hit
				with Keylime.
			</p>
			<div class="hero-actions">
				<Button size="large" onclick={handleGoToSignup}>
					Get Started Free
					<Icon icon="mingcute:arrow-right-line" class="ml-2 size-5" />
				</Button>
				<Button kind="outline" size="large" onclick={handleGoToLogin}>Learn More</Button>
			</div>
		</section>

		<section class="features">
			<div class="feature-grid">
				<div class="feature-card">
					<div class="feature-icon">
						<Icon icon="mingcute:music-2-line" class="size-12" />
					</div>
					<h3 class="feature-title">Intuitive Composition</h3>
					<p class="feature-desc">
						Build chord progressions with an easy-to-use pattern editor. Preview your work instantly.
					</p>
				</div>

				<div class="feature-card">
					<div class="feature-icon">
						<Icon icon="mingcute:group-line" class="size-12" />
					</div>
					<h3 class="feature-title">Share & Collaborate</h3>
					<p class="feature-desc">
						Publish your projects and discover creations from musicians worldwide. Follow your favorites.
					</p>
				</div>

				<div class="feature-card">
					<div class="feature-icon">
						<Icon icon="mingcute:plugin-2-line" class="size-12" />
					</div>
					<h3 class="feature-title">MIDI Export</h3>
					<p class="feature-desc">
						Export to MIDI or connect directly to your DAW. Seamless integration with your workflow.
					</p>
				</div>
			</div>
		</section>
	</main>

	<footer class="splash-footer">
		<p>&copy; 2025 Keylime. All rights reserved.</p>
	</footer>
</div>

<style>
	.splash-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.splash-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24px 48px;
		background-color: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.splash-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 24px;
	}

	.hero {
		text-align: center;
		max-width: 800px;
		margin-bottom: 120px;
	}

	.hero-title {
		font-size: 64px;
		font-weight: 800;
		line-height: 1.1;
		margin: 0 0 24px 0;
		letter-spacing: -0.02em;
	}

	.gradient-text {
		background: linear-gradient(90deg, #fff 0%, #f0f0f0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-subtitle {
		font-size: 20px;
		line-height: 1.6;
		margin: 0 0 40px 0;
		color: rgba(255, 255, 255, 0.9);
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.hero-actions {
		display: flex;
		gap: 16px;
		justify-content: center;
		align-items: center;
	}

	.features {
		width: 100%;
		max-width: 1200px;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 32px;
	}

	.feature-card {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-radius: 16px;
		padding: 32px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		transition: transform 0.2s ease;
	}

	.feature-card:hover {
		transform: translateY(-4px);
		background: rgba(255, 255, 255, 0.15);
	}

	.feature-icon {
		margin-bottom: 16px;
		opacity: 0.9;
	}

	.feature-title {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 12px 0;
	}

	.feature-desc {
		font-size: 16px;
		line-height: 1.6;
		margin: 0;
		color: rgba(255, 255, 255, 0.85);
	}

	.splash-footer {
		padding: 32px;
		text-align: center;
		background-color: rgba(0, 0, 0, 0.2);
		color: rgba(255, 255, 255, 0.7);
		font-size: 14px;
	}

	.splash-footer p {
		margin: 0;
	}

	@media (max-width: 768px) {
		.hero-title {
			font-size: 48px;
		}

		.hero-subtitle {
			font-size: 18px;
		}

		.feature-grid {
			grid-template-columns: 1fr;
		}

		.splash-header {
			padding: 16px 24px;
		}
	}
</style>
