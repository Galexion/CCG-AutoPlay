<script lang="ts">
	export let item: any;
	let TemplateDuration = 10;
	import { exportedTemplates } from '../../routes/customStuff';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/Button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	function storeTemplate(template: String, data: object) {
		exportedTemplates.update((n) => {
			n.push({ template, data });
		});
	}
	let savedTemplates;
	const unsubscribe = exportedTemplates.subscribe((value) => {
		savedTemplates = value;
	});

	function SendToServer(clip: String, TemplateDuration: number) {
		const options = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'User-Agent': 'insomnia/9.2.0' },
			body: `{"video_channel":1,"layer":11,"clip":"${clip}","playNow":1, "type":1, "stopAfterPlay": true, "duration":${TemplateDuration * 1000}, "additionalArgs": ${$customData}}`
		};
		fetch('/api/sendToServer', options)
			.then((response) => response.json())
			.catch((err) => console.error(err));
	}

	import { writable } from 'svelte/store';
	let customData = writable('{}');
</script>

<!-- svelte-ignore a11y-label-has-associated-control -->
<label>
	<p>Template Duration</p>
	<p style="display: block ruby;">
		<Input
			type="number"
			bind:value={TemplateDuration}
			min="0"
			class="mb-2 w-[410px] rounded-md border"
		/> Sec.
	</p>
</label>

<h2 class="mb-1 text-2xl font-semibold">Templates</h2>
<ScrollArea class="h-[325px] w-[450px] rounded-md border pb-2 pl-4 pr-4 pt-2">
	<br />
	{#each item.templateList as template}
		<div class="clip">
			<h2 class="clipname w-[420px] font-semibold leading-loose">
				{template.split(' - ')[template.split(' - ').length - 1]}
				{#each template.split(' - ') as tag}
					{#if tag != template.split(' - ')[template.split(' - ').length - 1]}
						<Badge variant="secondary" class="tag mr-1">
							<span style=" font-size:15px;" class="material-symbols-outlined">
								style
							</span>{tag}</Badge
						>
					{/if}
				{/each}
			</h2>

			<AlertDialog.Root>
				<AlertDialog.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						class="mt-2 rounded bg-gray-800 px-2 py-0.5 font-semibold text-white hover:bg-blue-700"
						>Play Template</Button
					>
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Enter Template Data</AlertDialog.Title>
						<AlertDialog.Description>
							<h3>Custom Template Data (JSON)</h3>
							<Textarea bind:value={$customData} style="width:98%;" />
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action on:click={() => SendToServer(template, TemplateDuration)}
							>Send Template</AlertDialog.Action>

							<!--
								TO BE IMPLEMENTED SOON.
						<AlertDialog.Action on:click={() => SendToServer(template, TemplateDuration)}
							>Save Template</AlertDialog.Action>
							-->
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>

			<!--

			<Button class="mt-2 rounded bg-gray-800 px-2 py-0.5 font-semibold text-white hover:bg-blue-700"
					
			on:click={() => SendToServer(template, JSON.parse(customData).text0.length * 0.16)}
			>Play Template with Calculated text0 length</Button
		>

		-->
		</div>
		<br />
	{/each}
</ScrollArea>

<h2 class="mb-1 text-2xl font-semibold">Saved Templates</h2>
<ScrollArea class="h-[325px] w-[450px] rounded-md border pb-2 pl-4 pr-4 pt-2">
	<br />
	{#each savedTemplates as template}
		<div class="clip">
			<h3 class="clipname">
				{template.template.split(' - ')[template.template.split(' - ').length - 1]}
				<p class="type"></p>
				{#each template.template.split(' - ') as tag}
					{#if tag != template.template.split(' - ')[template.template.split(' - ').length - 1]}
						<p class="type tag">
							<span
								style="
						position: relative;
						bottom: -0.23em;"
								class="material-symbols-outlined"
							>
								style
							</span>{tag}
						</p>
					{/if}
				{/each}
			</h3>
			<Button on:click={() => SendToServer(template, TemplateDuration)}>Play Template</Button>
			<Button on:click={() => SendToServer(template, JSON.parse(template.data).text0.length * 0.16)}
				>Play Template with Calculated text0 length</Button
			>
		</div>
		<br />
	{/each}
</ScrollArea>
