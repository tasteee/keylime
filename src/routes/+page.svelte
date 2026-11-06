<script lang="ts">
	import { ArrowRight, MusicNotes, UsersThree, PlugsConnected } from 'phosphor-svelte'
	import { goToPath } from '$lib/modules/navigate'
	import Logo from '$lib/components/shell/Logo.svelte'

	const features = [
		{
			icon: MusicNotes,
			title: 'Intuitive composition',
			description: 'Build chord progressions with an easy-to-use pattern editor. Preview your work instantly.'
		},
		{
			icon: UsersThree,
			title: 'Share & collaborate',
			description: 'Publish your projects and discover creations from musicians worldwide. Follow your favorites.'
		},
		{
			icon: PlugsConnected,
			title: 'MIDI export',
			description: 'Export to MIDI or connect directly to your DAW. Seamless integration with your workflow.'
		}
	]

	const currentYear = new Date().getFullYear()

	const handleGoToLogin = () => {
		goToPath('/auth/login')
	}
</script>

<z-column isFullHeight class="splash">
	<z-row insetX="lg" insetY="md" alignsX="between" alignsY="center" isFullWidth>
		<Logo />
		<z-row gap="sm" alignsY="center">
			<z-button kind="ghost" onclick={handleGoToLogin}>Log in</z-button>
			<z-button tone="primary" onclick={handleGoToLogin}>Sign up</z-button>
		</z-row>
	</z-row>
	<z-separator></z-separator>

	<z-scroll class="splashScroll">
		<z-section spaceTop="4xl" spaceBottom="4xl" container="xl" gutter="lg">
			<z-column gap="4xl">
				<z-column gap="lg" alignsX="center" class="hero">
					<z-eyebrow label="Chord progressions, simplified" tone="primary"></z-eyebrow>
					<z-display size="md" class="heroTitle">Create music with chord progressions</z-display>
					<z-text size="lg" color="muted" class="heroSubtitle">
						A powerful, intuitive tool for musicians to compose, collaborate, and share chord progressions. Build your next
						hit with Keylime.
					</z-text>
					<z-row gap="sm" alignsY="center" alignsX="center">
						<z-button size="lg" tone="primary" onclick={handleGoToLogin}>
							Get started free
							<ArrowRight size={18} weight="bold" />
						</z-button>
						<z-button size="lg" kind="outline" onclick={handleGoToLogin}>Learn more</z-button>
					</z-row>
				</z-column>

				<z-grid minColumnWidth="18rem" gap="lg">
					{#each features as feature (feature.title)}
						<z-card gap="md">
							<feature.icon size={32} />
							<z-text size="xl" weight={600} color="strong">{feature.title}</z-text>
							<z-text color="muted">{feature.description}</z-text>
						</z-card>
					{/each}
				</z-grid>
			</z-column>
		</z-section>

		<z-separator></z-separator>
		<z-row inset="lg" alignsX="center">
			<z-text size="sm" color="muted">&copy; {currentYear} Keylime. All rights reserved.</z-text>
		</z-row>
	</z-scroll>
</z-column>

<style>
	.splash {
		height: 100vh;
		overflow: hidden;
	}

	.splashScroll {
		flex: 1;
		min-height: 0;
	}

	.hero {
		text-align: center;
	}

	.heroTitle {
		max-width: 52rem;
	}

	.heroSubtitle {
		max-width: 40rem;
	}
</style>
