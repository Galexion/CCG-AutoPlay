<script lang="ts">
	export let item: any;
    let processedMediaList = item.mediaList.map(clip => {
        let splitArray = clip.clip.split(" - ");
        return { splitArray };
    });
	function SendToServer(clip:any) {
		const options = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json'},
			body: `{"video_channel":1,"layer":10,"clip":"${clip}","playNow":1}`
		};
		fetch('/api/sendToServer', options)
			.then((response) => response.json())
			.catch((err) => console.error(err));
	}
	function SendToQueue(clip:any,type:string,duration:number) {
		const options = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json'},
			body: `{"clip":"${clip}","type":"${type}","duration":${duration}}`
		};
		fetch('/api/queue/add', options)
			.then((response) => response.json())
			.catch((err) => console.error(err));
	}
    let regex = /\s-\s|\//gm;
    import { Badge } from "$lib/components/ui/badge";
    import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
    import { Input } from "$lib/components/ui/input";
	let searchTerm = '';
    let filteredClipList = item.mediaList
    $: {
		filteredClipList = item.mediaList.filter((clip) => {
			const titleMatch = clip.clip.toString().toLowerCase().includes(searchTerm.toLowerCase());
			return titleMatch;
		});
	}
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { Button } from "$lib/components/ui/button";
 
  let showStatusBar = true;
  let showActivityBar = false;
  let showPanel = false;
</script>
<div class=" flex gap-2 mb-2">
<Input type="search" placeholder="Search" bind:value={searchTerm} class="w-[400px]" />
<!--<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button variant="outline" builders={[builder]}>Filter</Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-56">
    <DropdownMenu.Label>Appearance</DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.CheckboxItem bind:checked={showStatusBar}>
      Status Bar
    </DropdownMenu.CheckboxItem>
    <DropdownMenu.CheckboxItem bind:checked={showActivityBar} disabled>
      Activity Bar
    </DropdownMenu.CheckboxItem>
    <DropdownMenu.CheckboxItem bind:checked={showPanel}
      >Panel</DropdownMenu.CheckboxItem
    >
  </DropdownMenu.Content>
</DropdownMenu.Root>-->
</div>
<ScrollArea class="h-[793px] w-[400px] rounded-md border p-4">
<div class="gap-2" style="width:110%">
        {#each filteredClipList as clip}
        {#if clip.type != "STILL"} 
        {@const adjustedFramerate = clip.framerate > 1000 ? clip.framerate / 1000 : clip.framerate}
        {@const seconds = Math.floor(clip.frames / adjustedFramerate)}
            <div class="clip pt-3">
                <h3 class="clipname font-semibold">
                    {clip.clip.split(regex)[clip.clip.split(regex).length - 1]}
                    <Badge variant="secondary" class="{clip.type}">{clip.type}</Badge>
                    {#each clip.clip.split(regex) as tag}
                        {#if tag != clip.clip.split(regex)[clip.clip.split(regex).length - 1]}
                    <Badge variant="secondary" class="tag mr-1">
                        <span style=" font-size:15px;" class="material-symbols-outlined">
                        style
                        </span>{tag}</Badge>
                        {/if}
                    {/each}
                </h3>
                <h4>
						{#if Math.floor(seconds / 3600) >= 1}
						{Math.floor(seconds / 3600)}h
						{/if}
						{#if Math.floor((seconds %= 3600) / 60) > 0}
						{Math.floor((seconds %= 3600) / 60)}m
						{/if}
						{#if (seconds % 60) > 0}
						{seconds % 60}s
						{:else}
						0s
						{/if}
                    </h4>
                <button on:click={() => SendToServer(clip.clip)} class="bg-gray-800 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded mt-2">Play Clip</button>
                <button on:click={() => SendToQueue(clip.clip,clip.type,seconds)} class="bg-gray-800 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded mt-2">Add to Queue</button>
            </div>
            <br>
        {/if}
        {/each}
    </div>
    </ScrollArea>