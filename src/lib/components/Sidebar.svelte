<script lang="ts">
	import projectStore from '$lib/stores/project.svelte'
	import SelectBpm from './SelectBpm.svelte'
	import SelectKey from './SelectKey.svelte'
	import SelectScale from './SelectScale.svelte'
	import SelectOctave from './SelectOctave.svelte'
	import SelectInstrument from './SelectInstrument.svelte'
	import SelectMidiDevice from './SelectMidiDevice.svelte'
	import SelectMidiChannel from './SelectMidiChannel.svelte'
	import SelectOutputType from './SelectOutputType.svelte'
	import output from '$lib/stores/output.svelte'
	import { Separator } from '$lib/components/ui/separator'
	import { ScrollArea } from '$lib/components/ui/scroll-area'

	const isInstrument = $derived(output.type === 'Instrument')
	const isMidi = $derived(output.type === 'MIDI')
</script>

<div class="bg-sidebar text-sidebar-foreground flex h-full flex-col">
	<div class="border-sidebar-border px-4 flex h-[60px] items-center border-b">
		<h1 class="text-lg font-semibold tracking-tight">{projectStore.title || 'Untitled Project'}</h1>
	</div>

	<ScrollArea class="flex-1">
		<div class="space-y-6 p-4">
			<!-- Project Settings -->
			<div class="space-y-3">
				<h2 class="text-xs font-semibold text-muted-foreground">Project</h2>
				<div class="gap-2 grid">
					<div class="flex items-center justify-between">
						<span class="text-sm">BPM</span>
						<SelectBpm />
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm">Key</span>
						<SelectKey />
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm">Scale</span>
						<SelectScale />
					</div>
				</div>
			</div>

			<Separator class="bg-sidebar-border" />

			<!-- Output Settings -->
			<div class="space-y-3">
				<h2 class="text-xs font-semibold text-muted-foreground">Output</h2>
				<div class="gap-2 grid">
					<div class="flex items-center justify-between">
						<span class="text-sm">Type</span>
						<SelectOutputType />
					</div>

					{#if isInstrument}
						<div class="flex items-center justify-between">
							<span class="text-sm">Instrument</span>
							<SelectInstrument />
						</div>
					{/if}

					{#if isMidi}
						<div class="flex items-center justify-between">
							<span class="text-sm">Device</span>
							<SelectMidiDevice />
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm">Channel</span>
							<SelectMidiChannel />
						</div>
					{/if}

					<div class="flex items-center justify-between">
						<span class="text-sm">Octave</span>
						<SelectOctave />
					</div>
				</div>
			</div>
		</div>
	</ScrollArea>
</div>
