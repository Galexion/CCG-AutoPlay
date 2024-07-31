<script lang="ts">
	export let item: any;
	let TemplateDuration = 10;
	import {exportedTemplates} from '../../routes/customStuff';

	function storeTemplate(template:string,data:object) {
		exportedTemplates.update((n) => {
			n.push({template,data})
		});
	}
	let savedTemplates;
	const unsubscribe = exportedTemplates.subscribe((value) => {
		savedTemplates = value;
	});

	function SendToServer(clip:string, TemplateDuration:number) {
		const options = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'User-Agent': 'insomnia/9.2.0' },
			body: `{"video_channel":1,"layer":11,"clip":"${clip}","playNow":1, "type":1, "stopAfterPlay": true, "duration":${TemplateDuration * 1000}, "additionalArgs": ${item.customData}}`
		};
		fetch('/api/sendToServer', options)
			.then((response) => response.json())
			.catch((err) => console.error(err));
	}
</script>

<label
	><p>Template Duration</p>
	<p
		style="
display: block ruby;"
	>
		<input type="number" bind:value={TemplateDuration} min="0" /> Sec.
	</p>
</label>
<h2>Templates</h2>

<h3>Saved Templates</h3>
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
	<button on:click={() => SendToServer(template, TemplateDuration)}>Play Template</button>
	<button on:click={() => SendToServer(template, JSON.parse(template.data).text0.length * 0.16)}
		>Play Template with Calculated text0 length</button
	>
</div>
<br />
{/each}

<h3>Templates</h3>
{#each item.templateList as template}
	<div class="clip">
		<h3 class="clipname">
			{template.split(' - ')[template.split(' - ').length - 1]}
			<p class="type"></p>
			{#each template.split(' - ') as tag}
				{#if tag != template.split(' - ')[template.split(' - ').length - 1]}
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
		<button on:click={() => SendToServer(template, TemplateDuration)}>Play Template</button>
		<button on:click={() => SendToServer(template, JSON.parse(item.customData).text0.length * 0.16)}
			>Play Template with Calculated text0 length</button
		>
		<button on:click={() => storeTemplate(template, JSON.parse(item.customData))}>Save Template</button>
	</div>
	<br />
{/each}
