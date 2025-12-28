<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui'

	let { ref = $bindable(null), ...restProps }: DropdownMenuPrimitive.TriggerProps = $props()
</script>

<DropdownMenuPrimitive.Trigger bind:ref data-slot="dropdown-menu-trigger" {...restProps} />

<style>
	:global([data-slot='dropdown-menu-trigger'][data-state='open'] > button) {
		outline: 2px solid var(--a-05);
		outline-offset: -2px;
		transition: none;
	}
</style>
