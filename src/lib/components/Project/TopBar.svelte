<script lang="ts">
	import { SquaresFour, MusicNotes, ArrowLeft, PencilSimple, Gear } from 'phosphor-svelte'
	import Logo from '$lib/components/shell/Logo.svelte'
	import UserMenu from '$lib/components/shell/UserMenu.svelte'
	import DialogUserSettings from '$lib/components/DialogUserSettings.svelte'
	import SelectOutput from './SelectOutput.svelte'
	import SelectBpm from './SelectBpm.svelte'
	import SelectOctave from './SelectOctave.svelte'
	import SelectKeyScale from './SelectKeyScale.svelte'
	import DialogProjectSettings from './DialogProjectSettings.svelte'
	import { useProjectEditor } from '$lib/modules/useProjectEditor'
	import { goToPath } from '$lib/modules/navigate'

	const projectEditor = useProjectEditor()
	const project = $derived(projectEditor.state.project)
	const activeView = $derived(projectEditor.state.activeView)

	let isProjectSettingsOpen = $state(false)
	let isUserSettingsOpen = $state(false)

	const handleViewPress = (view: 'chords' | 'pattern') => {
		projectEditor.state.activeView = view
	}

	const handleBackPress = () => {
		goToPath('/dashboard')
	}

	const openProjectSettings = () => {
		isProjectSettingsOpen = true
	}

	const handleProjectSettingsOpenChange = (open: boolean) => {
		isProjectSettingsOpen = open
	}

	const openUserSettings = () => {
		isUserSettingsOpen = true
	}

	const closeUserSettings = () => {
		isUserSettingsOpen = false
	}
</script>

<z-column>
	<z-row insetX="lg" insetY="sm" alignsX="between" alignsY="center" gap="xl" isFullWidth>
		<z-row gap="sm" alignsY="center" class="topBarSection topBarTitleSection">
			<z-tooltip content="Back" placement="bottom">
				<z-button kind="ghost" size="sm" onclick={handleBackPress} aria-label="Back">
					<ArrowLeft size={16} />
				</z-button>
			</z-tooltip>

			<Logo hasWordmark={false} />

			<z-button kind="ghost" size="sm" onclick={openProjectSettings} aria-label="Edit project settings">
				<span class="projectTitle">{project.title}</span>
				<PencilSimple size={14} />
			</z-button>
		</z-row>

		<z-row gap="md" alignsY="center" class="topBarSection">
			<z-toggle-button-group size="sm" kind="outline" aria-label="Editor view">
				<z-toggle-button-group-item value="chords" isPressed={activeView === 'chords'} onpress={() => handleViewPress('chords')}>
					<SquaresFour size={16} />
					Chords
				</z-toggle-button-group-item>
				<z-toggle-button-group-item value="pattern" isPressed={activeView === 'pattern'} onpress={() => handleViewPress('pattern')}>
					<MusicNotes size={16} />
					Pattern
				</z-toggle-button-group-item>
			</z-toggle-button-group>

			<SelectBpm />
			<SelectOctave />
			<SelectKeyScale />
		</z-row>

		<z-row gap="md" alignsY="center" class="topBarSection">
			<SelectOutput />

			<z-tooltip content="Project settings" placement="bottom">
				<z-button kind="outline" size="sm" onclick={openProjectSettings} aria-label="Project settings">
					<Gear size={16} />
				</z-button>
			</z-tooltip>

			<UserMenu onOpenSettings={openUserSettings} />
		</z-row>
	</z-row>
	<z-separator></z-separator>
</z-column>

<DialogProjectSettings isOpen={isProjectSettingsOpen} onOpenChange={handleProjectSettingsOpenChange} {projectEditor} />
<DialogUserSettings isOpen={isUserSettingsOpen} onClose={closeUserSettings} />

<style>
	.topBarSection {
		min-width: 0;
	}

	.topBarTitleSection {
		flex-shrink: 1;
	}

	.projectTitle {
		max-width: 14rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
