<script lang="ts">
	import { Avatar as AvatarPrimitive } from 'bits-ui'
	import { cn } from '$lib/utils.js'

	let { ref = $bindable(null), class: className, ...restProps }: AvatarPrimitive.FallbackProps = $props()
</script>

<AvatarPrimitive.Fallback bind:ref data-slot="avatar-fallback" class={cn('AvatarFallback', className)} {...restProps} />

<style>
	:global(.AvatarFallback) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background-color: var(--n-03);
		border: 1px solid var(--n-05);
		font-size: 14px;
	}
</style>
