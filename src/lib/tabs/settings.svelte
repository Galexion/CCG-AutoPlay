<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as HoverCard from '$lib/components/ui/hover-card';
    import { onMount } from 'svelte';

	let regex = /\s-\s|\//gm;
	let defaultregex = /\s-\s|\//gm;
	let exclip = 'programs/artist - name - tag1 - tag2.mp4';

	let refreshtrigger = 0;
	let queuelength = undefined;
	let layers = [[1,10],[1,20]]
	let settings = undefined;

	async function grabSettings() {
			const options = {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
			};

			try {
					const response = await fetch('/api/settings', options);
					if (!response.ok) {
							throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.json();
					settings = data;
					queuelength = settings.find((e) => e.setting == "queuelength")?.data || undefined;
					layers[0][0] == settings.find((e) => e.setting == "clipch")?.data
					layers[0][1] == settings.find((e) => e.setting == "clipLayer")?.data
					layers[1][0] == settings.find((e) => e.setting == "bugch")?.data
					layers[1][1] == settings.find((e) => e.setting == "bugLayer")?.data
					console.log(data)
			} catch (err) {
					console.error('Error fetching settings:', err);
			}
	}

	async function updateSettings() {
			const options = {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(settings)
			};

			try {
					const response = await fetch('/api/settings', options);
					if (!response.ok) {
							throw new Error(`HTTP error! status: ${response.status}`);
					}
					console.log('Settings updated successfully');
			} catch (err) {
					console.error('Error updating settings:', err);
			}
	}

	// Call grabSettings when the component mounts
        onMount(() => {
                grabSettings();
        });
</script>
{#if settings}
<ScrollArea class="h-[793px] w-[400px] rounded-md border p-4">
	<h2 class="text-3xl font-semibold">General</h2>

	<h3 class="text-2xl">Autoplay</h3>
	<HoverCard.Root>
		<HoverCard.Trigger>
			<p>Queue Length</p></HoverCard.Trigger
		>
		<HoverCard.Content>
			<p>
				The Minimum Allowed Queue Length. If the Queue drops below this number, CG-Autoplay will put
				something in automatically from the list.<br /><br /> Setting this to 0 will disable this function.
			</p>
		</HoverCard.Content>
	</HoverCard.Root>
	<Input class="m-1 w-[360px]" type="number" min="0" bind:value={queuelength} />

	<h3 class="text-2xl">Channels & Layers</h3>

	<HoverCard.Root>
		<HoverCard.Trigger>
			<p>Clip Layer</p></HoverCard.Trigger
		>
		<HoverCard.Content>
			<p>The Channel & Layer that Clips will be played on.</p>
		</HoverCard.Content>
	</HoverCard.Root>
	<div style="display:flex;">
		<p class="m-2">CH</p>
		<Input class="m-1 w-[107px]" type="number" min="0" bind:value={layers[0][0]} />
		<p class="m-2">Layer</p>
		<Input class="m-1 w-[150px]" type="number" min="0" bind:value={layers[0][1]} />
	</div>

	<h4 class="text-1xl">Autotagging</h4>

	<HoverCard.Root>
		<HoverCard.Trigger>
			<p>Auto Tag Regex</p></HoverCard.Trigger
		>
		<HoverCard.Content>
			<p>Customize the Regex that seperates the file Names into Tags.</p>
			<br /><br />
			<p>
				Example:<br /><code>programs/artist - name - tag1 - tag2.mp4</code> with
				<code>/\s-\s|\//gm</code> becomes:
			</p>
			<br />
			<h3 class="font-semibold">
				{exclip.split(defaultregex)[exclip.split(defaultregex).length - 1]}
				<Badge variant="secondary" class="MOVIE">MOVIE</Badge>
				{#each exclip.split(defaultregex) as tag}
					{#if tag != exclip.split(defaultregex)[exclip.split(defaultregex).length - 1]}
						<Badge variant="secondary" class="tag mr-1">
							<span style=" font-size:15px;" class="material-symbols-outlined">
								style
							</span>{tag}</Badge
						>
					{/if}
				{/each}
			</h3>
		</HoverCard.Content>
	</HoverCard.Root>
	<Input class="m-1 w-[360px]" type="text" bind:value={regex} />

	<HoverCard.Root>
		<HoverCard.Trigger>
			<p>File Name Area</p></HoverCard.Trigger
		>
		<HoverCard.Content>
			<p>
				Controls where the Name in the file is found, everything else around it is considered a tag.
			</p>
		</HoverCard.Content>
	</HoverCard.Root>
	<Input class="m-1 w-[360px]" type="number" min="0" />
</ScrollArea>
{/if}