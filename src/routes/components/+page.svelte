<script lang="ts">
	import { Plus, CircleHalf, UsersFour, Moon, ArrowCounterClockwise, ArrowClockwise } from 'phosphor-svelte'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import { Checkbox } from '$lib/components/ui/checkbox'
	import { Switch } from '$lib/components/ui/switch'
	import { Slider } from '$lib/components/ui/slider'
	import * as Card from '$lib/components/ui/card'
	import * as Select from '$lib/components/ui/select'
	import { Separator } from '$lib/components/ui/separator'
	import Icon from '@iconify/svelte'

	const BUTTONS = [
		{ kind: 'solid', size: 'small', color: 'neutral', text: 'New Project', icon: Plus, action: () => {} },
		{ kind: 'solid', size: 'small', color: 'neutral', text: 'Explore', icon: UsersFour, action: () => {} },
		{ kind: 'solid', size: 'small', color: 'neutral', text: 'Toggle Theme', icon: CircleHalf, action: () => {} },
		{ kind: 'solid', size: 'small', color: 'neutral', text: 'Undo', icon: ArrowCounterClockwise, action: () => {} },
		{ kind: 'solid', size: 'small', color: 'neutral', text: 'Redo', icon: ArrowClockwise, action: () => {} }
	]
</script>

<h1>howdy</h1>
