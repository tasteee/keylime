<script lang="ts">
	import projectStore from '$lib/stores/project.svelte'
</script>

<div class="InfoBar">
	{projectStore.infoText || 'Welcome to Keylime! Start by adding chords to your progression.'}
</div>

<style>
	.InfoBar {
		background: var(--n-08);
		padding: 0px 12px;
		display: flex;
		align-items: center;
		font-size: 10px;
		color: var(--n-04);
		height: 32px;
	}
</style>
