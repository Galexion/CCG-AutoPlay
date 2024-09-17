<script lang="ts">
	interface SubCategory {
		name: String;
		ratio: number;
	}

	interface Category {
		open: boolean | undefined;
		name: String;
		tag?: String;
	}

	interface TagArray {
		name: String;
		open: Boolean;
		ratio: Number;
	}

	interface Ratios {
		name: string;
		tags: Array<TagArray>;
		tag: String;
		ratio: Number;
		open: Array<Boolean>;
		openadd: boolean;
	}
	let categories: Array<Category> = [];
	let Ratios: Array<Ratios> = [];
	let programRoll: Array<String> = [];
	let programRollSelect: string | String;

	let advTabs = [
		{ label: 'Catagories', value: 0 },
		{ label: 'Ratios', value: 1 }
	];

	let catTags: Array<String> = [];

	export let item: any;
	import * as Tabs from '$lib/components/ui/tabs';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Accordion from '$lib/components/ui/accordion';
	import Check from 'svelte-radix/Check.svelte';
	import CaretSort from 'svelte-radix/CaretSort.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import { onMount, tick } from 'svelte';

	let regex = /\s-\s|\//gm;
	let defaultregex = /\s-\s|\//gm;
	let exclip = 'programs/artist - name - tag1 - tag2';
	item.mediaList = item.mediaList.filter((clip) => {
		return clip.type !== 'STILL';
	});

	let refreshtrigger: number = 0;
	let queuelength: number = 5;
	let layers: Array<any> = [
		[1, 10],
		[1, 20]
	];
	let settings: Array<any> = [];
	let nameArrayPlace: number = 1;
	let categoryNamePlace: number = 0;

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
			queuelength = settings.find((e) => e.setting == 'queuelength')?.data || undefined;
			nameArrayPlace = settings.find((e) => e.setting == 'arrayNameArea')?.data || undefined;
			layers[0][0] = settings.find((e) => e.setting == 'clipch')?.data;
			layers[0][1] = settings.find((e) => e.setting == 'clipLayer')?.data;
			layers[1][0] = settings.find((e) => e.setting == 'bugch')?.data;
			layers[1][1] = settings.find((e) => e.setting == 'bugLayer')?.data;
			categories = JSON.parse(settings.find((e) => e.setting == 'categories')?.data) || [];
			programRoll = JSON.parse(settings.find((e) => e.setting == 'programRoll')?.data) || [];
			Ratios = JSON.parse(settings.find((e) => e.setting == 'ratios')?.data) || [];
			console.log(data);
			grabTags();
		} catch (err) {
			console.error('Error fetching settings:', err);
		}
	}

	async function updateSettings() {
		settings.find((e) => e.setting == 'queuelength').data = queuelength || undefined;
		settings.find((e) => e.setting == 'arrayNameArea').data = nameArrayPlace || undefined;
		settings.find((e) => e.setting == 'clipch').data = layers[0][0];
		settings.find((e) => e.setting == 'clipLayer').data = layers[0][1];
		settings.find((e) => e.setting == 'bugch').data = layers[1][0];
		settings.find((e) => e.setting == 'bugLayer').data = layers[1][1];
		settings.find((e) => e.setting == 'categories').data = JSON.stringify(categories);
		settings.find((e) => e.setting == 'programRoll').data = JSON.stringify(programRoll);
		settings.find((e) => e.setting == 'ratios').data = JSON.stringify(Ratios);
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
	async function grabTags() {
		for (const clip of item.mediaList) {
			let clipName: String = clip.clip.toString().split(regex)[categoryNamePlace];
			if (!catTags.find((element) => element == clipName)) {
				catTags.push(clipName);
				catTags = catTags;
			}
		}
	}

	let newcategory = '';
	let newratiocategory = '';
	let open = false;
	let value = '';
	$: selectedValue =
		catTags.find((f) => {
			return f === value;
		}) ?? 'Select a Tag...';

	function addCategory() {
		if (newcategory.length > 0) {
			categories.push({
				name: newcategory,
				tag: ''
			});
			categories = categories;
			/* a dumb fucking workaround because apparently svelte is inept enough to not reconise when a push() updates the array */
			newcategory = '';
		}
	}

	function addRatio() {
		if (newratiocategory.length > 0) {
			Ratios.push({
				name: newratiocategory,
				tags: [],
				tag: '',
				ratio: 0,
				open: [],
				openadd: false
			});
			Ratios = Ratios;
			/* a dumb fucking workaround because apparently svelte is inept enough to not reconise when a push() updates the array */
			newratiocategory = '';
		}
	}

	function addProgramToRoll(program: String) {
		programRoll.push(program);
		programRoll = programRoll;
	}
	function removeProgramFromRoll(program: String) {
		const index = programRoll.indexOf(program);
		const x = programRoll.splice(index, 1);

		programRoll = programRoll;
	}

	// Call grabSettings when the component mounts
	onMount(() => {
		grabSettings();
	});

	function closeAndFocusTrigger(triggerId: any) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	function addTags(name: String, increment: number) {
		console.log('Attempting to add Tag');
		Ratios[increment].tags.push({ name, open: false, number: 0 });
		Ratios[increment].tag = '';
	}
</script>

{#if settings}
	<ScrollArea class="h-[793px] w-[450px] rounded-md border p-4">
		<HoverCard.Root>
			<HoverCard.Trigger>
				<h2 class="text-3xl font-semibold">Server Side</h2>
			</HoverCard.Trigger>
			<HoverCard.Content>
				<p>
					This is the backend Settings of CasparCG Autoplay. Settings will be refleted
					automatically.
				</p>
			</HoverCard.Content>
		</HoverCard.Root>

		<h3 class="text-2xl">Autoplay</h3>
		<HoverCard.Root>
			<HoverCard.Trigger>
				<p>Queue Length</p></HoverCard.Trigger
			>
			<HoverCard.Content>
				<p>
					The Minimum Allowed Queue Length. If the Queue drops below this number, CG-Autoplay will
					put something in automatically from the list.<br /><br /> Setting this to 0 will disable
					this function.<br /><br />If this setting is put on {Math.round(
						item.mediaList.filter((clip) => {
							return clip.type !== 'STILL';
						}).length / 2
					)} or higher, there will not be enough content to fill the queue.<br /><br />
					{item.mediaList.filter((clip) => {
						return clip.type !== 'STILL';
					}).length} Videos are avalible, At least 1 must be free for the queue to work.
				</p>
			</HoverCard.Content>
		</HoverCard.Root>
		<Input
			class="m-1 w-[411px]"
			type="number"
			min="0"
			max={item.mediaList.filter((clip) => {
				return clip.type !== 'STILL';
			}).length - 1}
			bind:value={queuelength}
		/>
		{#if Math.round(item.mediaList.filter((clip) => {
				return clip.type !== 'STILL';
			}).length / 2) < queuelength}
			<p class=" w-[411px]">
				Only {Math.round(
					item.mediaList.filter((clip) => {
						return clip.type !== 'STILL';
					}).length / 2
				)} Queue Slots can be filled with the amount of content you have, expect {item.mediaList.filter(
					(clip) => {
						return clip.type !== 'STILL';
					}
				).length -
					queuelength +
					1} items to be on the queue.
			</p>
		{/if}
		{#if item.mediaList.filter((clip) => {
			return clip.type !== 'STILL';
		}).length - 1 == queuelength}
			<p>
				{item.mediaList.filter((clip) => {
					return clip.type !== 'STILL';
				}).length} Videos are avalible, At least 1 must be free for the queue to work.
			</p>
		{/if}

		<!-- ADVANCED SETTINGS FOR AUTO PLAY -->
		<Sheet.Root>
			<Sheet.Trigger>
				<Button variant="outline">Advanced Settings</Button></Sheet.Trigger
			>
			<Sheet.Content>
				<Sheet.Header>
					{#if categoryNamePlace == -1}
						<Sheet.Title>Advanced Autoplay is not Avalible.</Sheet.Title>
						<Sheet.Description>
							<p>
								Advanced Autoplay is only accessible when the <code>category Name Area</code>
								setting has been configured.<br /><br />Please set that setting, then try again.
							</p>
						</Sheet.Description>
					{:else}
						<Sheet.Title class="text-3xl">Advanced Autoplay</Sheet.Title>
						<Sheet.Description>
							<Tabs.Root value="Clips" class="mt-2">
								<div class="flex">
									<Tabs.List class=" m-auto">
										{#each advTabs as item}
											<Tabs.Trigger value={item.label}>{item.label}</Tabs.Trigger>
										{/each}
									</Tabs.List>
								</div>
								{#each advTabs as item}
									<Tabs.Content value={item.label} class="content-center">
										{#if item.label == 'Catagories'}
											<div class="flex">
												<Input
													class=" mr-1 w-[411px]"
													type="text"
													bind:value={newcategory}
													placeholder="Category Name"
												/>
												<Button
													variant="outline"
													class="hover:bg-green-700"
													on:click={() => addCategory()}>Add</Button
												>
											</div>
											{#if categories.length > 0}
												{#each categories as catagory, i}
													<Accordion.Root>
														<Accordion.Item value="item-1">
															<Accordion.Trigger
																><p class="font-bold text-white">
																	{catagory.name}
																</p></Accordion.Trigger
															>
															<Accordion.Content class="text-white">
																<!-- Tag Selector -->
																<Popover.Root bind:open={categories[i].open} let:ids>
																	<Popover.Trigger asChild let:builder>
																		<Button
																			builders={[builder]}
																			variant="outline"
																			role="combobox"
																			aria-expanded={categories[i].open}
																			class="w-[200px] justify-between"
																		>
																			{categories[i].tag || 'No Tag Selected...'}
																			<CaretSort class="ml-2 h-4 w-4 shrink-0 opacity-50" />
																		</Button>
																	</Popover.Trigger>
																	<Popover.Content class="w-[200px] p-0">
																		<Command.Root>
																			<Command.Input placeholder="Search tags..." class="h-9" />
																			<Command.Empty>No tags found.</Command.Empty>
																			<Command.Group>
																				{#each catTags as tag}
																					<Command.Item
																						value={tag}
																						onSelect={(currentValue) => {
																							categories[i].tag = currentValue;
																							closeAndFocusTrigger(ids.trigger);
																						}}
																					>
																						<Check
																							class={cn(
																								'mr-2 h-4 w-4',
																								categories[i].tag !== tag && 'text-transparent'
																							)}
																						/>
																						{tag}
																					</Command.Item>
																				{/each}
																			</Command.Group>
																		</Command.Root>
																	</Popover.Content>
																</Popover.Root>
																<!-- Either Tag Association / SubTags -->
															</Accordion.Content>
														</Accordion.Item>
													</Accordion.Root>
												{/each}
												<Button
													on:click={() => updateSettings()}
													class="mt-2 rounded bg-gray-800 px-4 py-2 font-bold text-white hover:bg-green-700"
												>
													Save Settings
												</Button>
											{:else}
												<p>
													You'll need to add a category to use this feature. Create one to get
													started.
												</p>
											{/if}
										{:else if item.label == 'Ratios'}
										
											<h1 class="pb-1 text-2xl font-extrabold text-white">Program Roll</h1>
											<div class="flex pb-1">
												<Popover.Root class=" " let:ids>
													<Popover.Trigger asChild let:builder>
														<Button
															builders={[builder]}
															variant="outline"
															role="combobox"
															class="mr-1 w-[420px] justify-between"
														>
															{programRollSelect || 'No Ratio Category Selected...'}
															<CaretSort class="ml-2 h-4 w-4 shrink-0 opacity-50" />
														</Button>
													</Popover.Trigger>
													<Popover.Content class=" p-0">
														<Command.Root>
															<Command.Input placeholder="Search tags..." class="h-9" />
															<Command.Empty>No tags found.</Command.Empty>
															<Command.Group>
																{#each Ratios as tag}
																	<Command.Item
																		value={tag.name}
																		onSelect={(currentValue) => {
																			programRollSelect = currentValue;
																			closeAndFocusTrigger(ids.trigger);
																		}}
																	>
																		<Check
																			class={cn(
																				'mr-2 h-4 w-4',
																				programRollSelect !== tag.name && 'text-transparent'
																			)}
																		/>
																		{tag.name}
																	</Command.Item>
																{/each}
															</Command.Group>
														</Command.Root>
													</Popover.Content>
												</Popover.Root>
												<Button
													variant="outline"
													class="hover:bg-green-700"
													on:click={() => addProgramToRoll(programRollSelect)}>Add</Button
												>
											</div>
											{#each programRoll as program, i}
												<div class="mb-1 rounded-md border p-4">
													<div class="flex">
														<span class="inline-flex items-center space-x-1">
															<h1 class="text-2xl font-extrabold text-white">{i + 1}.&nbsp;</h1>
															<h1 class="text-xl font-bold text-white">{program}</h1>
														</span>
														<Button
															variant="outline"
															class="ml-auto hover:bg-red-700"
															on:click={() => removeProgramFromRoll(i)}>Remove</Button
														>
													</div>
												</div>
											{/each}
											<hr class="mb-4 mt-4" />
											<div class="flex">
												<Input
													class=" mr-1 w-[411px]"
													type="text"
													bind:value={newratiocategory}
													placeholder="Ratio Category Name"
												/>
												<Button
													variant="outline"
													class="hover:bg-green-700"
													on:click={() => addRatio()}>Add</Button
												>
											</div>
											<!-- TODO: Add a Visual Here, Pie Chart or 2 tone line -->
											<Accordion.Root>
													{#each Ratios as ratio, ii}
														<Accordion.Root>
															<Accordion.Item value={ratio.name}>
																<Accordion.Trigger>
																	<p class="font-bold text-white">
																		{ratio.name}
																	</p>
																</Accordion.Trigger>
																<Accordion.Content class="text-white w-[340px]">
																	<!-- Tag Selector -->
																	<!-- If Ratio[ii] tags length < 1, then only show this, else show each tag -->
																	{#each ratio.tags as ratioTag}
																	<div class="flex gap-1 mb-1">
																		<Popover.Root bind:open={ratioTag.open} let:ids>
																			<Popover.Trigger asChild let:builder>
																				<Button
																					builders={[builder]}
																					variant="outline"
																					role="combobox"
																					aria-expanded={ratio.open}
																					class=" w-[150px] justify-between"
																				>
																					{ratioTag.name || 'No Tag Selected...'}
																					<CaretSort class="ml-2 h-4 w-4 shrink-0 opacity-50" />
																				</Button>
																			</Popover.Trigger>
																			<Popover.Content class="w-[200px]">
																				<Command.Root>
																					<Command.Input placeholder="Search tags..." class="h-9" />
																					<Command.Empty>No tags found.</Command.Empty>
																					<Command.Group>
																						{#each catTags as tag}
																							<Command.Item
																								value={tag}
																								onSelect={(currentValue) => {
																									ratioTag.name = currentValue;
																									closeAndFocusTrigger(ids.trigger);
																								}}
																							>
																								<Check
																									class={cn(
																										'mr-2 h-4 w-4',
																										ratioTag.name !== tag && 'text-transparent'
																									)}
																								/>
																								{tag}
																							</Command.Item>
																						{/each}
																					</Command.Group>
																				</Command.Root>
																			</Popover.Content>
																		</Popover.Root>
																		<Input type="number" bind:value={ratioTag.ratio} min="0" class="w-[102px]" />
																		<Button variant="outline"
																			on:click={() => updateSettings()}
																			class="rounded px-4 py-2 text-white hover:bg-red-700"
																		>
																			Delete
																	</Button>
																	</div>
																	{/each}
																	<!-- Add new Catagories -->
																	<div class="flex">
																		<Popover.Root bind:open={ratio.openadd} let:ids>
																			<Popover.Trigger asChild let:builder>
																				<Button
																					builders={[builder]}
																					variant="outline"
																					role="combobox"
																					aria-expanded={ratio.open}
																					class="mr-1 w-[411px] justify-between"
																				>
																					{ratio.tag || 'No Tag Selected...'}
																					<CaretSort class="ml-2 h-4 w-4 shrink-0 opacity-50" />
																				</Button>
																			</Popover.Trigger>
																			<Popover.Content class="w-[200px] p-0">
																				<Command.Root>
																					<Command.Input placeholder="Search tags..." class="h-9" />
																					<Command.Empty>No tags found.</Command.Empty>
																					<Command.Group>
																						{#each catTags as tag}
																							<Command.Item
																								value={tag}
																								onSelect={(currentValue) => {
																									ratio.tag = currentValue;
																									closeAndFocusTrigger(ids.trigger);
																								}}
																							>
																								<Check
																									class={cn(
																										'mr-2 h-4 w-4',
																										ratio.tag !== tag && 'text-transparent'
																									)}
																								/>
																								{tag}
																							</Command.Item>
																						{/each}
																					</Command.Group>
																				</Command.Root>
																			</Popover.Content>
																		</Popover.Root>
																		<Button
																			variant="outline"
																			class="hover:bg-green-700"
																			on:click={() => addTags(ratio.tag, ii)}>Add</Button
																		>
																	</div>
																	<!-- Either Tag Association / SubTags -->
																</Accordion.Content>
															</Accordion.Item>
														</Accordion.Root>
													{/each}
											</Accordion.Root>

											<Button variant="outline"
												on:click={() => updateSettings()}
												class="mt-2 rounded px-4 py-2 font-bold text-white hover:bg-green-700"
											>
												Save Settings
											</Button>
										{/if}
									</Tabs.Content>
								{/each}
							</Tabs.Root>
						</Sheet.Description>
					{/if}
				</Sheet.Header>
			</Sheet.Content>
		</Sheet.Root>

		<h3 class="text-2xl">Channels & Layers</h3>

		<HoverCard.Root>
			<HoverCard.Trigger>
				<p>Clip Layer</p>
			</HoverCard.Trigger>
			<HoverCard.Content>
				<p>The Channel & Layer that Clips will be played on.</p>
			</HoverCard.Content>
		</HoverCard.Root>
		<div style="display:flex;">
			<p class="m-2">CH</p>
			<Input class="m-1 w-[107px]" type="number" min="0" bind:value={layers[0][0]} />
			<p class="m-2">Layer</p>
			<Input class="m-1 w-[200px]" type="number" min="0" bind:value={layers[0][1]} />
		</div>

		<HoverCard.Root>
			<HoverCard.Trigger>
				<p>Channel Bug Layer</p>
			</HoverCard.Trigger>
			<HoverCard.Content>
				<p>The Channel & Layer that Channel Bug will be shown on.</p>
			</HoverCard.Content>
		</HoverCard.Root>
		<div style="display:flex;">
			<p class="m-2">CH</p>
			<Input class="m-1 w-[107px]" type="number" min="0" bind:value={layers[1][0]} />
			<p class="m-2">Layer</p>
			<Input class="m-1 w-[200px]" type="number" min="0" bind:value={layers[1][1]} />
		</div>

		<HoverCard.Root>
			<HoverCard.Trigger>
				<h2 class="text-3xl font-semibold">Client Side</h2>
			</HoverCard.Trigger>
			<HoverCard.Content>
				<p>
					This is the Front-End Settings of CasparCG Autoplay. You'll need to refresh the page to
					see the settings be reflected.
				</p>
			</HoverCard.Content>
		</HoverCard.Root>
		<h4 class="text-1xl">Autotagging</h4>

		<HoverCard.Root>
			<HoverCard.Trigger>
				<p>Auto Tag Regex</p>
			</HoverCard.Trigger>
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
		<Input class="m-1 w-[411px]" type="text" bind:value={regex} />

		<HoverCard.Root>
			<HoverCard.Trigger>
				<p>File Name Area</p>
			</HoverCard.Trigger>
			<HoverCard.Content>
				<p>
					Controls where the Name in the file is found, everything else around it is considered a
					tag.<br /><br />
					Please Ensure the Name is in the same place in the Autotag system, or else a tag will be selected
					as a tag and vice versa for any files that don't follow the format.<br /><br />
					The Live Example Below shows the file with the most tags on it, and the Max of this setting
					has been set accordingly. Please be mindful of where you have put the name of the programs.
				</p>
			</HoverCard.Content>
		</HoverCard.Root>
		<Input
			class="m-1 w-[411px]"
			type="number"
			min="0"
			max={item.mediaList
				.filter((clip) => {
					return clip.type !== 'STILL';
				})[0]
				.clip.split(defaultregex).length - 1}
			bind:value={nameArrayPlace}
		/>
		<HoverCard.Root>
			<HoverCard.Trigger>
				<p>Category Name Area</p>
			</HoverCard.Trigger>
			<HoverCard.Content>
				<p>
					Controls where the Name in the file is found. Optional but is required for Advanced
					Autoplay to work.<br /><br />Setting this to <code>-1</code> will disable this feature.<br
					/><br />Ensure all content is at least in a sub folder.
				</p>
			</HoverCard.Content>
		</HoverCard.Root>
		<Input
			class="m-1 w-[411px]"
			type="number"
			min="-1"
			max={item.mediaList
				.filter((clip) => {
					return clip.type !== 'STILL';
				})[0]
				.clip.split(defaultregex).length - 1}
			bind:value={categoryNamePlace}
		/>
		<p>Live Example:</p>
		<h3 class="w-[411px] font-semibold">
			{item.mediaList[0].clip.split(defaultregex)[nameArrayPlace]}
			<Badge variant="secondary" class="MOVIE">MOVIE</Badge>
			{#each item.mediaList[0].clip.split(defaultregex) as tag}
				{#if tag != item.mediaList
						.filter((clip) => {
							return clip.type !== 'STILL';
						})[0]
						.clip.split(defaultregex)
						.reverse()[item.mediaList[0].clip.split(defaultregex).length - nameArrayPlace]}
					<Badge variant="secondary" class="tag mr-1">
						<span style=" font-size:15px;" class="material-symbols-outlined">
							style
						</span>{tag}</Badge
					>
				{/if}
			{/each}
		</h3>
		{#if categoryNamePlace != -1}
			<p class="w-[411px]">
				category: <Badge variant="secondary" class="tag mr-1">
					<span style=" font-size:15px;" class="material-symbols-outlined">
						style
					</span>{item.mediaList[0].clip.split(defaultregex)[categoryNamePlace]}</Badge
				>
			</p>
		{/if}
	</ScrollArea>
	<Button
		on:click={() => updateSettings()}
		class="mt-2 rounded bg-gray-800 px-4 py-2 font-bold text-white hover:bg-green-700"
	>
		Save Settings
	</Button>
{/if}
