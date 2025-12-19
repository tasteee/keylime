<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import { Checkbox } from '$lib/components/ui/checkbox'
	import { Switch } from '$lib/components/ui/switch'
	import { Slider } from '$lib/components/ui/slider'
	import * as Card from '$lib/components/ui/card'
	import * as Select from '$lib/components/ui/select'
	import { Separator } from '$lib/components/ui/separator'
	import HerButton from '$lib/components/HerButton.svelte'
	import SheButton from '$lib/components/SheButton.svelte'
	import SheCard from '$lib/components/SheCard.svelte'
	import HerDivider from '$lib/components/HerDivider.svelte'
	import ReplicatedButton from '$lib/components/ReplicatedButton.svelte'
	import ReplicatedDropdown from '$lib/components/ReplicatedDropdown.svelte'
	import Icon from '@iconify/svelte'
	import { Plus, CircleHalf, UsersFour, Moon, ArrowCounterClockwise, ArrowClockwise } from 'phosphor-svelte'

	let selectedColorSpace = $state('sRGB')
	let selectedColorModel = $state('LCH')

	const colorSpaceOptions = [
		{ label: 'sRGB', value: 'sRGB' },
		{ label: 'Display P3', value: 'p3' },
		{ label: 'Adobe RGB', value: 'adobe' },
		{ label: 'ProPhoto RGB', value: 'prophoto' }
	]

	const colorModelOptions = [
		{ label: 'LCH', value: 'LCH' },
		{ label: 'LAB', value: 'LAB' },
		{ label: 'HSL', value: 'HSL' },
		{ label: 'RGB', value: 'RGB' }
	]

	const handleColorSpaceSelect = (value: string) => {
		selectedColorSpace = value
		console.log('Selected color space:', value)
	}

	const handleColorModelSelect = (value: string) => {
		selectedColorModel = value
		console.log('Selected color model:', value)
	}

	const colors = [
		{ name: 'Background', var: '--background' },
		{ name: 'Foreground', var: '--foreground' },
		{ name: 'Card', var: '--card' },
		{ name: 'Card Foreground', var: '--card-foreground' },
		{ name: 'Popover', var: '--popover' },
		{ name: 'Popover Foreground', var: '--popover-foreground' },
		{ name: 'Primary', var: '--primary' },
		{ name: 'Primary Foreground', var: '--primary-foreground' },
		{ name: 'Secondary', var: '--secondary' },
		{ name: 'Secondary Foreground', var: '--secondary-foreground' },
		{ name: 'Muted', var: '--muted' },
		{ name: 'Muted Foreground', var: '--muted-foreground' },
		{ name: 'Accent', var: '--accent' },
		{ name: 'Accent Foreground', var: '--accent-foreground' },
		{ name: 'Destructive', var: '--destructive' },
		{ name: 'Destructive Foreground', var: '--destructive-foreground' },
		{ name: 'Border', var: '--border' },
		{ name: 'Input', var: '--input' },
		{ name: 'Ring', var: '--ring' }
	]

	const scales = [
		{
			name: 'Neutral',
			colors: [
				{ name: '50', var: '--color-neutral-50' },
				{ name: '100', var: '--color-neutral-100' },
				{ name: '200', var: '--color-neutral-200' },
				{ name: '300', var: '--color-neutral-300' },
				{ name: '400', var: '--color-neutral-400' },
				{ name: '500', var: '--color-neutral-500' },
				{ name: '600', var: '--color-neutral-600' },
				{ name: '700', var: '--color-neutral-700' },
				{ name: '800', var: '--color-neutral-800' },
				{ name: '900', var: '--color-neutral-900' },
				{ name: '950', var: '--color-neutral-950' }
			]
		},
		{
			name: 'Primary',
			colors: [
				{ name: '50', var: '--color-primary-50' },
				{ name: '100', var: '--color-primary-100' },
				{ name: '200', var: '--color-primary-200' },
				{ name: '300', var: '--color-primary-300' },
				{ name: '400', var: '--color-primary-400' },
				{ name: '500', var: '--color-primary-500' },
				{ name: '600', var: '--color-primary-600' },
				{ name: '700', var: '--color-primary-700' },
				{ name: '800', var: '--color-primary-800' },
				{ name: '900', var: '--color-primary-900' },
				{ name: '950', var: '--color-primary-950' }
			]
		},
		{
			name: 'Danger',
			colors: [
				{ name: '50', var: '--color-danger-50' },
				{ name: '100', var: '--color-danger-100' },
				{ name: '200', var: '--color-danger-200' },
				{ name: '300', var: '--color-danger-300' },
				{ name: '400', var: '--color-danger-400' },
				{ name: '500', var: '--color-danger-500' },
				{ name: '600', var: '--color-danger-600' },
				{ name: '700', var: '--color-danger-700' },
				{ name: '800', var: '--color-danger-800' },
				{ name: '900', var: '--color-danger-900' },
				{ name: '950', var: '--color-danger-950' }
			]
		}
	]
</script>

<div class="p-12 space-y-10 pb-20">
	<!-- Solid Neutral -->
	<div class="gap-4 flex items-center">
		<!-- <Button kind="solid" size="large">
			<Plus size={16} weight="bold" />
			<span>Solid Large</span>
		</Button> -->

		<Button kind="solid" size="medium">
			<Plus size={16} weight="bold" />
			<span>Solid Medium</span>
		</Button>

		<Button kind="solid" size="small">
			<Plus size={16} weight="bold" />
			<span>Solid Small</span>
		</Button>
	</div>

	<!-- Solid Red -->
	<div class="gap-4 flex items-center">
		<!-- <Button kind="solid" color="red" size="large">
			<Plus size={16} weight="bold" />
			<span>Solid Red Large</span>
		</Button> -->

		<Button kind="solid" color="red" size="medium">
			<Plus size={16} weight="bold" />
			<span>Solid Red Medium</span>
		</Button>

		<Button kind="solid" color="red" size="small">
			<Plus size={16} weight="bold" />
			<span>Solid Red Small</span>
		</Button>
	</div>

	<!-- Solid Brand -->
	<div class="gap-4 flex items-center">
		<!-- <Button kind="solid" color="brand" size="large">
			<Plus size={16} weight="bold" />
			<span>Solid Brand Large</span>
		</Button> -->

		<Button kind="solid" color="brand" size="medium">
			<Plus size={16} weight="bold" />
			<span>Solid Brand Medium</span>
		</Button>

		<Button kind="solid" color="brand" size="small">
			<Plus size={16} weight="bold" />
			<span>Solid Brand Small</span>
		</Button>
	</div>

	<!-- Outline Neutral -->
	<div class="gap-4 flex items-center">
		<!-- <Button kind="outline" size="large">
			<Plus size={16} weight="bold" />
			<span>Outline Large</span>
		</Button> -->

		<Button kind="outline" size="medium">
			<Plus size={16} weight="bold" />
			<span>Outline Medium</span>
		</Button>

		<Button kind="outline" size="small">
			<Plus size={16} weight="bold" />
			<span>Outline Small</span>
		</Button>
	</div>

	<!-- Outline Red -->
	<div class="gap-4 flex items-center">
		<!-- <Button kind="outline" color="red" size="large">
			<Plus size={16} weight="bold" />
			<span>Outline Red Large</span>
		</Button> -->

		<Button kind="outline" color="red" size="medium">
			<Plus size={16} weight="bold" />
			<span>Outline Red Medium</span>
		</Button>

		<Button kind="outline" color="red" size="small">
			<Plus size={16} weight="bold" />
			<span>Outline Red Small</span>
		</Button>
	</div>

	<!-- Outline Brand -->
	<div class="gap-4 flex items-center">
		<!-- <Button kind="outline" color="brand" size="large">
			<Plus size={16} weight="bold" />
			<span>Outline Brand Large</span>
		</Button> -->

		<Button kind="outline" color="brand" size="medium">
			<Plus size={16} weight="bold" />
			<span>Outline Brand Medium</span>
		</Button>

		<Button kind="outline" color="brand" size="small">
			<Plus size={16} weight="bold" />
			<span>Outline Brand Small</span>
		</Button>
	</div>

	<!-- Ghost Neutral -->
	<div class="gap-4 flex items-center">
		<!-- <Button kind="ghost" size="large">
			<Plus size={16} weight="bold" />
			<span>Ghost Large</span>
		</Button> -->

		<Button kind="ghost" size="medium">
			<Plus size={16} weight="bold" />
			<span>Ghost Medium</span>
		</Button>

		<Button kind="ghost" size="small">
			<Plus size={16} weight="bold" />
			<span>Ghost Small</span>
		</Button>
	</div>

	<!-- Ghost Red -->
	<div class="gap-4 flex items-center">
		<!-- <Button kind="ghost" color="red" size="large">
			<Plus size={16} weight="bold" />
			<span>Ghost Red Large</span>
		</Button> -->

		<Button kind="ghost" color="red" size="medium">
			<Plus size={16} weight="bold" />
			<span>Ghost Red Medium</span>
		</Button>

		<Button kind="ghost" color="red" size="small">
			<Plus size={16} weight="bold" />
			<span>Ghost Red Small</span>
		</Button>
	</div>

	<!-- Ghost Brand -->
	<div class="gap-4 flex items-center">
		<!-- <Button kind="ghost" color="brand" size="large">
			<Plus size={16} weight="bold" />
			<span>Ghost Brand Large</span>
		</Button> -->

		<Button kind="ghost" color="brand" size="medium">
			<Plus size={16} weight="bold" />
			<span>Ghost Brand Medium</span>
		</Button>

		<Button kind="ghost" color="brand" size="small">
			<Plus size={16} weight="bold" />
			<span>Ghost Brand Small</span>
		</Button>
	</div>

	<!-- Icon Buttons Solid Neutral -->
	<div class="gap-4 flex items-center">
		<Button kind="solid" color="neutral" size="small" isIcon={true}>
			<Plus size={16} weight="bold" />
		</Button>

		<Button kind="solid" color="neutral" size="medium" isIcon={true}>
			<Plus size={16} weight="bold" />
		</Button>

		<Button kind="solid" color="neutral" size="large" isIcon={true}>
			<Plus size={16} weight="bold" />
		</Button>
	</div>

	<!-- Icon Buttons Solid Red -->
	<div class="gap-4 flex items-center">
		<Button kind="solid" color="red" size="small" isIcon={true}>
			<Moon size={16} weight="fill" />
		</Button>

		<Button kind="solid" color="red" size="medium" isIcon={true}>
			<Moon size={16} weight="fill" />
		</Button>

		<Button kind="solid" color="red" size="large" isIcon={true}>
			<Moon size={16} weight="fill" />
		</Button>
	</div>

	<!-- Icon Buttons Solid Brand -->
	<div class="gap-4 flex items-center">
		<Button kind="solid" color="brand" size="small" isIcon={true}>
			<CircleHalf size={16} weight="fill" />
		</Button>

		<Button kind="solid" color="brand" size="medium" isIcon={true}>
			<CircleHalf size={16} weight="fill" />
		</Button>

		<Button kind="solid" color="brand" size="large" isIcon={true}>
			<CircleHalf size={16} weight="fill" />
		</Button>
	</div>

	<!-- Icon Buttons Outline Neutral -->
	<div class="gap-4 flex items-center">
		<Button kind="outline" color="neutral" size="small" isIcon={true}>
			<UsersFour size={18} weight="fill" />
		</Button>

		<Button kind="outline" color="neutral" size="medium" isIcon={true}>
			<UsersFour size={18} weight="fill" />
		</Button>

		<Button kind="outline" color="neutral" size="large" isIcon={true}>
			<UsersFour size={18} weight="fill" />
		</Button>
	</div>

	<!-- Icon Buttons Outline Red -->
	<div class="gap-4 flex items-center">
		<Button kind="outline" color="red" size="small" isIcon={true}>
			<ArrowCounterClockwise size={16} weight="fill" />
		</Button>

		<Button kind="outline" color="red" size="medium" isIcon={true}>
			<ArrowCounterClockwise size={16} weight="fill" />
		</Button>

		<Button kind="outline" color="red" size="large" isIcon={true}>
			<ArrowCounterClockwise size={16} weight="fill" />
		</Button>
	</div>

	<!-- Icon Buttons Outline Brand -->
	<div class="gap-4 flex items-center">
		<Button kind="outline" color="brand" size="small" isIcon={true}>
			<ArrowClockwise size={16} weight="fill" />
		</Button>

		<Button kind="outline" color="brand" size="medium" isIcon={true}>
			<ArrowClockwise size={16} weight="fill" />
		</Button>

		<Button kind="outline" color="brand" size="large" isIcon={true}>
			<ArrowClockwise size={16} weight="fill" />
		</Button>
	</div>

	<!-- Icon Buttons Ghost Neutral -->
	<div class="gap-4 flex items-center">
		<Button kind="ghost" color="neutral" size="small" isIcon={true}>
			<Plus size={16} weight="bold" />
		</Button>

		<Button kind="ghost" color="neutral" size="medium" isIcon={true}>
			<Plus size={16} weight="bold" />
		</Button>

		<Button kind="ghost" color="neutral" size="large" isIcon={true}>
			<Plus size={16} weight="bold" />
		</Button>
	</div>

	<!-- Icon Buttons Ghost Red -->
	<div class="gap-4 flex items-center">
		<Button kind="ghost" color="red" size="small" isIcon={true}>
			<Moon size={16} weight="fill" />
		</Button>

		<Button kind="ghost" color="red" size="medium" isIcon={true}>
			<Moon size={16} weight="fill" />
		</Button>

		<Button kind="ghost" color="red" size="large" isIcon={true}>
			<Moon size={16} weight="fill" />
		</Button>
	</div>

	<!-- Icon Buttons Ghost Brand -->
	<div class="gap-4 flex items-center">
		<Button kind="ghost" color="brand" size="small" isIcon={true}>
			<CircleHalf size={16} weight="fill" />
		</Button>

		<Button kind="ghost" color="brand" size="medium" isIcon={true}>
			<CircleHalf size={16} weight="fill" />
		</Button>

		<Button kind="ghost" color="brand" size="large" isIcon={true}>
			<CircleHalf size={16} weight="fill" />
		</Button>
	</div>

	<!-- Toolbar Component -->
	<div class="space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold">Toolbar</h2>
			<p class="text-muted-foreground">A toolbar with various buttons and controls</p>
		</div>

		<div
			class="gap-4 px-6 py-2 flex h-[45px] items-center justify-start overflow-hidden border-b border-[#E3E1E9] bg-[#F8F7FE]"
		>
			<!-- Add Button -->
			<ReplicatedButton label="Add">
				{#snippet icon()}
					<Plus size={16} weight="bold" />
				{/snippet}
			</ReplicatedButton>

			<!-- Contrast Group -->
			<div class="rounded-md shadow-sm flex items-center overflow-hidden">
				<div class="rounded-md shadow-sm overflow-hidden">
					<ReplicatedButton label="Contrast">
						{#snippet icon()}
							<CircleHalf size={16} weight="fill" />
						{/snippet}
					</ReplicatedButton>
				</div>
			</div>

			<!-- Vision Button -->
			<div class="rounded-md shadow-sm overflow-hidden">
				<ReplicatedButton label="Vision">
					{#snippet icon()}
						<UsersFour size={18} weight="fill" />
					{/snippet}
				</ReplicatedButton>
			</div>

			<!-- Luminance Button -->
			<ReplicatedButton label="Luminance">
				{#snippet icon()}
					<Moon size={16} weight="fill" />
				{/snippet}
			</ReplicatedButton>

			<!-- Spacer -->
			<div class="-mx-3 flex-grow"></div>

			<!-- Right Side Controls -->
			<div class="gap-2 flex flex-shrink-0 items-center">
				<!-- Color Space Dropdown -->
				<ReplicatedDropdown
					label={selectedColorSpace}
					options={colorSpaceOptions}
					selectedValue={selectedColorSpace}
					header="Current project color space"
					footer={{
						text: "Changing color spaces doesn't cause any color loss. Feel free to experiment.",
						link: {
							text: 'What is the difference?',
							href: 'https://atmos.style/support/project/color-space'
						}
					}}
					onSelect={handleColorSpaceSelect}
				/>

				<!-- Color Model Dropdown -->
				<ReplicatedDropdown
					label={selectedColorModel}
					options={colorModelOptions}
					selectedValue={selectedColorModel}
					onSelect={handleColorModelSelect}
				/>

				<!-- Undo/Redo Group -->
				<div class="rounded-md shadow-sm h-6 flex items-center overflow-hidden">
					<ReplicatedButton label="" disabled={true} class="h-6 w-7 rounded-none">
						{#snippet icon()}
							<ArrowCounterClockwise size={16} weight="fill" />
						{/snippet}
					</ReplicatedButton>
					<ReplicatedButton label="" disabled={true} class="h-6 w-7 rounded-none border-l border-[#D5D3DC]">
						{#snippet icon()}
							<ArrowClockwise size={16} weight="fill" />
						{/snippet}
					</ReplicatedButton>
				</div>
			</div>
		</div>
	</div>

	<Separator />

	<div class="space-y-2">
		<h1 class="text-3xl font-bold">Design System</h1>
		<p class="text-muted-foreground">Documentation of the components and styles used in Keylime.</p>
	</div>

	<Separator />

	<!-- Colors -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Colors</h2>
		<div class="md:grid-cols-4 gap-4 grid grid-cols-2">
			{#each colors as color}
				<div class="space-y-1.5">
					<div class="h-20 rounded-md shadow-sm w-full border" style="background-color: var({color.var})"></div>
					<div class="space-y-0.5">
						<p class="text-sm font-medium">{color.name}</p>
						<p class="text-xs text-muted-foreground font-mono">{color.var}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<Separator />

	<!-- Color Scales -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Color Scales</h2>
		<div class="space-y-8">
			{#each scales as scale}
				<div class="space-y-2">
					<h3 class="text-lg font-medium">{scale.name}</h3>
					<div class="gap-2 grid grid-cols-11">
						{#each scale.colors as color}
							<div class="space-y-1.5">
								<div class="h-12 rounded-md shadow-sm w-full border" style="background-color: var({color.var})"></div>
								<div class="space-y-0.5 text-center">
									<p class="text-xs font-medium">{color.name}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<Separator />
	<!-- Typography -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Typography</h2>
		<div class="space-y-4">
			<div class="space-y-1">
				<h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl">Heading 1</h1>
				<p class="text-sm text-muted-foreground">text-4xl font-extrabold tracking-tight lg:text-5xl</p>
			</div>
			<div class="space-y-1">
				<h2 class="text-3xl font-semibold tracking-tight first:mt-0">Heading 2</h2>
				<p class="text-sm text-muted-foreground">text-3xl font-semibold tracking-tight</p>
			</div>
			<div class="space-y-1">
				<h3 class="text-2xl font-semibold tracking-tight">Heading 3</h3>
				<p class="text-sm text-muted-foreground">text-2xl font-semibold tracking-tight</p>
			</div>
			<div class="space-y-1">
				<h4 class="text-xl font-semibold tracking-tight">Heading 4</h4>
				<p class="text-sm text-muted-foreground">text-xl font-semibold tracking-tight</p>
			</div>
			<div class="space-y-1">
				<p class="leading-7 [&:not(:first-child)]:mt-6">
					The king, seeing how much happier his subjects were, realized the error of his ways and repealed the joke tax.
				</p>
				<p class="text-sm text-muted-foreground">Body text (p)</p>
			</div>
			<div class="space-y-1">
				<p class="text-sm font-medium leading-none">Small text with medium weight</p>
				<p class="text-sm text-muted-foreground">text-sm font-medium leading-none</p>
			</div>
			<div class="space-y-1">
				<p class="text-sm text-muted-foreground">Muted text for secondary information.</p>
				<p class="text-sm text-muted-foreground">text-sm text-muted-foreground</p>
			</div>
		</div>
	</section>

	<Separator />

	<!-- Buttons -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Buttons</h2>

		<div class="space-y-4">
			<h3 class="text-lg font-medium">Variants</h3>
			<div class="gap-4 flex flex-wrap">
				<Button variant="default">Default</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="destructive">Destructive</Button>
				<Button variant="link">Link</Button>
			</div>
		</div>

		<div class="space-y-4">
			<h3 class="text-lg font-medium">Sizes</h3>
			<div class="gap-4 flex flex-wrap items-center">
				<Button size="sm">Small</Button>
				<Button size="default">Default</Button>
				<Button size="lg">Large</Button>
				<Button size="icon"><Icon icon="mingcute:add-line" /></Button>
			</div>
		</div>
	</section>

	<Separator />

	<!-- Custom Components -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Custom Components</h2>

		<div class="space-y-4">
			<h3 class="text-lg font-medium">HerButton</h3>
			<div class="gap-4 flex flex-wrap">
				<HerButton kind="solid" color="gray">Solid Gray</HerButton>
				<HerButton kind="solid" color="pink">Solid Pink</HerButton>
				<HerButton kind="outline">Outline</HerButton>
				<HerButton kind="ghost">Ghost</HerButton>
			</div>
		</div>

		<div class="space-y-4">
			<h3 class="text-lg font-medium">SheButton</h3>
			<div class="gap-4 flex flex-wrap">
				<SheButton kind="solid" color="default" label="Solid Default" />
				<SheButton kind="solid" color="danger" label="Solid Danger" />
				<SheButton kind="outline" label="Outline" />
				<SheButton kind="ghost" label="Ghost" />
			</div>
		</div>

		<div class="space-y-4">
			<h3 class="text-lg font-medium">HerDivider</h3>
			<div class="gap-4 flex flex-col">
				<div class="gap-2 flex items-center">
					<span>Left</span>
					<HerDivider direction="vertical" height="20px" />
					<span>Right</span>
				</div>
				<div class="w-full">
					<HerDivider direction="horizontal" />
				</div>
			</div>
		</div>

		<div class="space-y-4">
			<h3 class="text-lg font-medium">SheCard</h3>
			<div class="md:grid-cols-2 gap-4 grid">
				<SheCard>
					<h4 class="font-bold mb-2">Standard Card</h4>
					<p>This is a standard SheCard component.</p>
				</SheCard>
				<SheCard isHoverable={true}>
					<h4 class="font-bold mb-2">Hoverable Card</h4>
					<p>This card has a hover effect.</p>
				</SheCard>
			</div>
		</div>
	</section>

	<Separator />

	<!-- Inputs -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Inputs & Forms</h2>

		<div class="gap-4 max-w-sm grid">
			<div class="max-w-sm gap-1.5 grid w-full items-center">
				<Label htmlFor="email">Email</Label>
				<Input type="email" id="email" placeholder="Email" />
			</div>

			<div class="space-x-2 flex items-center">
				<Checkbox id="terms" />
				<Label
					htmlFor="terms"
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Accept terms and conditions
				</Label>
			</div>

			<div class="space-x-2 flex items-center">
				<Switch id="airplane-mode" />
				<Label htmlFor="airplane-mode">Airplane Mode</Label>
			</div>

			<div class="space-y-2">
				<Label>Volume</Label>
				<Slider value={[50]} max={100} step={1} />
			</div>

			<div class="space-y-2">
				<Label>Select Framework</Label>
				<Select.Root>
					<Select.Trigger class="w-[180px]">
						<p>Select a fruit</p>
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Fruits</Select.Label>
							<Select.Item value="apple">Apple</Select.Item>
							<Select.Item value="banana">Banana</Select.Item>
							<Select.Item value="blueberry">Blueberry</Select.Item>
							<Select.Item value="grapes">Grapes</Select.Item>
							<Select.Item value="pineapple">Pineapple</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</section>

	<Separator />

	<!-- Cards -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Cards</h2>
		<div class="md:grid-cols-2 gap-4 grid">
			<Card.Root>
				<Card.Header>
					<Card.Title>Card Title</Card.Title>
					<Card.Description>Card Description</Card.Description>
				</Card.Header>
				<Card.Content>
					<p>Card Content</p>
				</Card.Content>
				<Card.Footer>
					<p>Card Footer</p>
				</Card.Footer>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Create project</Card.Title>
					<Card.Description>Deploy your new project in one-click.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="gap-4 grid w-full items-center">
						<div class="space-y-1.5 flex flex-col">
							<Label htmlFor="name">Name</Label>
							<Input id="name" placeholder="Name of your project" />
						</div>
					</div>
				</Card.Content>
				<Card.Footer class="flex justify-between">
					<Button variant="outline">Cancel</Button>
					<Button>Deploy</Button>
				</Card.Footer>
			</Card.Root>
		</div>
	</section>

	<Separator />

	<!-- Replicated Components -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Replicated Components</h2>

		<div class="space-y-4">
			<h3 class="text-lg font-medium">ReplicatedButton</h3>
			<div class="gap-4 flex flex-wrap">
				<ReplicatedButton label="Default" />
				<ReplicatedButton label="With Icon">
					{#snippet icon()}
						<Plus size={16} weight="bold" />
					{/snippet}
				</ReplicatedButton>
				<ReplicatedButton label="Icon After" iconAfter={true}>
					{#snippet icon()}
						<Moon size={16} weight="fill" />
					{/snippet}
				</ReplicatedButton>
				<ReplicatedButton label="Disabled" disabled={true} />
			</div>
		</div>

		<div class="space-y-4">
			<h3 class="text-lg font-medium">ReplicatedDropdown</h3>
			<div class="gap-4 flex flex-wrap">
				<ReplicatedDropdown
					label="Color Space"
					options={colorSpaceOptions}
					selectedValue={selectedColorSpace}
					onSelect={handleColorSpaceSelect}
				/>
				<ReplicatedDropdown
					label="Color Model"
					options={colorModelOptions}
					selectedValue={selectedColorModel}
					onSelect={handleColorModelSelect}
				/>
				<ReplicatedDropdown label="Disabled" options={colorSpaceOptions} disabled={true} />
			</div>
		</div>
	</section>
</div>
