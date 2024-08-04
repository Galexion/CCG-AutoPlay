<script lang="ts">
	import type { LayoutData } from './$types';
	import { writable } from 'svelte/store';
	import { source } from 'sveltekit-sse';
	import { onMount } from 'svelte';
	export let data: LayoutData;
	data.mediaList.sort(
		(a, b) =>
			a.clip.split(' - ')[a.clip.split(' - ').length - 1] -
			b.clip.split(' - ')[b.clip.split(' - ').length - 1]
	);
	data.mediaList.sort(
		(a, b) =>
			a.clip.split(' - ')[a.clip.split(' - ').length - 2] -
			b.clip.split(' - ')[b.clip.split(' - ').length - 2]
	);

	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import Templates from '$lib/tabs/templates.svelte';
	import settingsTab from '$lib/tabs/settings.svelte';
	import Clips from '$lib/tabs/clips.svelte';
	import Overlays from '$lib/tabs/overlays.svelte';
	import { Badge } from '$lib/components/ui/badge';
	let queued: Array<any> = [];
	async function getQueue() {
		const options = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		};
		let response = await fetch('/api/queue', options).then((response) => response.json());
		console.log(response);
		queued = response;
		return response;
	}
	let typing = ['Program', 'Commerical', 'Skit', 'Bumper'];

	let nameArrayPlace: number = 1;
	let categoryNamePlace: number = 0;
	let settings: Array<any> = undefined;
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
			nameArrayPlace = settings.find((e) => e.setting == 'arrayNameArea')?.data || undefined;
			categoryNamePlace = settings.find((e) => e.setting == 'categoryNameArea')?.data || undefined;
			console.log(data);
		} catch (err) {
			console.error('Error fetching settings:', err);
		}
	}
	// Call grabSettings when the component mounts
	onMount(() => {
		grabSettings();
	});

	let customData = writable('{}');
	let items = {};
	$: items = [
		{ label: 'Clips', value: 1, component: Clips, mediaList: data.mediaList },
		{
			label: 'Templates',
			value: 2,
			component: Templates,
			templateList: data.templateList,
			customData: $customData
		},
		{
			label: 'Channel Bug',
			value: 2,
			component: Overlays,
			mediaList: data.mediaList,
			customData: $customData
		},
		{ label: 'Settings', value: 3, component: settingsTab, mediaList: data.mediaList }
	];

	function playbackControls(type) {
		const options = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'User-Agent': 'insomnia/9.2.0' },
			body: `{"type":${type}}`
		};
		fetch('/api/playbackctl', options)
			.then((response) => response.json())
			.catch((err) => console.error(err));
	}
	function removeFromQueue(id) {
		const options = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'User-Agent': 'insomnia/9.2.0' },
			body: `{"id":${id}}`
		};
		fetch('/api/queue/remove', options)
			.then((response) => response.json())
			.catch((err) => console.error(err));
		refreshTrigger = !refreshTrigger;
	}

	let playing = source('/api/queue/playing').select('status');
	let queueCheck = source('/api/queue/playing').select('queue');
	// Store the currently playing status
	let currentlyPlaying = {
		clip: ['0', '1011.2'],
		name: ['Please Wait... - Either Nothing is Playing, or CG-AP is still gathering data.'],
		path: ['media/PROGRAMS\\noodleSBSP90s.mp4'],
		streams: [{ file: [{ streams_0: [{ fps: ['60', '1'] }], streams_1: [{ fps: ['0', '0'] }] }] }],
		time: ['0', '0']
	};
	let lastPlayed = '';
	// Subscribe to the `playing` source
	$: playing.subscribe((event) => {
		if (event) {
			// Parse the JSON data received from the server
			currentlyPlaying = JSON.parse(event);
			if (currentlyPlaying.name.toString() !== lastPlayed) {
				refreshTrigger = !refreshTrigger;
			}
			lastPlayed = currentlyPlaying.name.toString();
		}
	});
	let lastQueue = '';
	$: queueCheck.subscribe((event) => {
		if (event) {
			// Parse the JSON data received from the server
			if (lastQueue.toString() !== event) {
				refreshTrigger = !refreshTrigger;
			}
			lastQueue = event;
		}
	});
	let regex = /\s-\s|\//gm;
	let refreshTrigger = true;
	let remainingTime = Math.floor(currentlyPlaying?.time[1] - currentlyPlaying?.time[0]);

	$: remainingTime = Math.floor(currentlyPlaying?.time[1] - currentlyPlaying?.time[0]);
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<svelte:head>
	<title>
		CG AP /
		{Math.floor(remainingTime / 3600)}h
		{Math.floor((remainingTime %= 3600) / 60)}m
		{remainingTime % 60}s Remaining
	</title>
</svelte:head>
<h1 class="text-4xl font-extrabold">CasparCG AutoPlay</h1>
<hr class="mb-4 mt-4" />
<div class="controlui">
	<div class="controls">
		<div class="mb-2">
			<h2 class="text-2xl font-semibold">Currently Playing</h2>

			<h3 class="pt-2 font-semibold">
				{currentlyPlaying.name.toString().split(regex)[nameArrayPlace]}
				{#each currentlyPlaying.name.toString().split(regex) as tag}
					{#if tag != currentlyPlaying?.name.toString().split(regex)[nameArrayPlace]}
						<Badge variant="secondary" class="tag mr-1">
							<span style=" font-size:15px;" class="material-symbols-outlined">
								style
							</span>{tag}</Badge
						>
					{/if}
				{/each}
			</h3>
			{#if currentlyPlaying?.time[1] == 0}
				<p></p>
			{:else}
				<p>
					{#if Math.floor(currentlyPlaying?.time[0] / 3600) >= 1}
						{Math.floor(currentlyPlaying?.time[0] / 3600) < 10 ? '0' : ''}{Math.floor(
							currentlyPlaying?.time[0] / 3600
						)}:{/if}{#if Math.floor((currentlyPlaying.time[0] %= 3600) / 60) >= 0}
						{Math.floor((currentlyPlaying.time[0] %= 3600) / 60) < 10 ? '0' : ''}{Math.floor(
							(currentlyPlaying.time[0] %= 3600) / 60
						)}:{/if}{#if currentlyPlaying?.time[0] % 60 >= 0}
						{currentlyPlaying?.time[0] % 60 < 10 ? '0' : ''}{Math.floor(
							currentlyPlaying?.time[0] % 60
						)}
					{/if} /
					{#if Math.floor(currentlyPlaying?.time[1] / 3600) >= 1}
						{Math.floor(currentlyPlaying?.time[1] / 3600) < 10 ? '0' : ''}{Math.floor(
							currentlyPlaying?.time[1] / 3600
						)}:{/if}{#if Math.floor((currentlyPlaying.time[1] %= 3600) / 60) >= 0}
						{Math.floor((currentlyPlaying.time[1] %= 3600) / 60) < 10 ? '0' : ''}{Math.floor(
							(currentlyPlaying.time[1] %= 3600) / 60
						)}:{/if}{#if currentlyPlaying?.time[1] % 60 >= 0}
						{currentlyPlaying?.time[1] % 60 < 10 ? '0' : ''}{Math.floor(
							currentlyPlaying?.time[1] % 60
						)}
					{/if}
				</p>
			{/if}
		</div>
		<div class="Playback">
			{#await getQueue(refreshTrigger)}
				<Button
					disabled
					on:click={() => playbackControls(3)}
					class="rounded bg-gray-800 px-4 py-2 font-bold text-white hover:bg-red-700"
				>
					Skip
				</Button>
			{:then queue}
				{#if queue.length < 1}
					<Button
						disabled
						on:click={() => playbackControls(3)}
						class="rounded bg-gray-800 px-4 py-2 font-bold text-white hover:bg-red-700"
					>
						Skip
					</Button>
				{:else}
					<Button
						on:click={() => playbackControls(3)}
						class="rounded bg-gray-800 px-4 py-2 font-bold text-white hover:bg-red-700"
					>
						Skip
					</Button>
				{/if}
			{/await}
			<Button
				on:click={() => playbackControls(4)}
				class="rounded bg-gray-800 px-4 py-2 font-bold text-white hover:bg-red-900"
				>Clear All</Button
			>
		</div>
		<h3>Custom Template Data (JSON)</h3>
		<Textarea bind:value={$customData} style="width:98%;" />
		<div class="pt-2">
			<h2 class="text-3xl font-semibold">Queue</h2>
			<Table.Root style="width:98%;">
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[300px]">Name</Table.Head>
						<Table.Head class="w-[100px]">Type</Table.Head>
						<Table.Head class="w-[100px]">Duration</Table.Head>
						<Table.Head class="w-[100px]">Time Till Air</Table.Head>
						<Table.Head class="text-right">Options</Table.Head>
					</Table.Row>
				</Table.Header>
				{#await getQueue(refreshTrigger)}
					<Table.Caption>Loading Queue Data, please wait.</Table.Caption>
				{:then queue}
					{#if queue.length == 0}
						<Table.Caption>There is nothing in the Queue.</Table.Caption>
					{/if}
					<Table.Body>
						{#each queue as item}
							{@const remainingTime = Math.floor(
								currentlyPlaying?.time[1] - currentlyPlaying?.time[0]
							)}
							<Table.Row>
								<Table.Cell class="font-medium">
									<h3 class="pt-2 font-semibold">
										{item.media.toString().split(regex)[nameArrayPlace]}
										{#each item.media.toString().split(regex) as tag}
											{#if tag != item.media.toString().split(regex)[nameArrayPlace]}
												<Badge variant="secondary" class="tag mr-1">
													<span style=" font-size:15px;" class="material-symbols-outlined">
														style
													</span>{tag}</Badge
												>
											{/if}
										{/each}
									</h3></Table.Cell
								>
								<Table.Cell>
									<Badge variant="secondary" class={item.type}>{item.type}</Badge></Table.Cell
								>
								<Table.Cell>
									{#if Math.floor(item.duration / 3600) >= 1}
										{Math.floor(item.duration / 3600)}h
									{/if}
									{#if Math.floor((item.duration %= 3600) / 60) > 0}
										{Math.floor((item.duration %= 3600) / 60)}m
									{/if}
									{#if item.duration % 60 > 0}
										{Math.floor(item.duration) % 60}s
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if item.id == 1}
										{#if Math.floor(remainingTime / 3600) >= 1}
											{Math.floor(remainingTime / 3600)}h
										{/if}
										{#if Math.floor((remainingTime %= 3600) / 60) > 0}
											{Math.floor((remainingTime %= 3600) / 60)}m
										{/if}
										{#if remainingTime % 60 > 0}
											{remainingTime % 60}s
										{:else}
											{remainingTime % 60}s
										{/if}
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									<div>
										<Button
											on:click={() => removeFromQueue(item.id)}
											class="rounded bg-gray-800 px-2 py-0.5 font-semibold text-white hover:bg-red-700"
											>Remove</Button
										>
										<Button
											on:click={() => removeFromQueue(item.id)}
											class="rounded bg-gray-800 px-2 py-0.5 font-semibold text-white hover:bg-red-700"
											>Replace</Button
										>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				{/await}
			</Table.Root>
		</div>
	</div>
	<div class="clips">
		<Tabs.Root value="Clips" class="w-[450px]">
			<div class="flex">
			<Tabs.List class=" m-auto">
				{#each items as item}
					<Tabs.Trigger value={item.label}>{item.label}</Tabs.Trigger>
				{/each}
			</Tabs.List>
		</div>
			{#each items as item}
				<Tabs.Content value={item.label}>
					<svelte:component this={item.component} {item} />
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</div>
</div>
