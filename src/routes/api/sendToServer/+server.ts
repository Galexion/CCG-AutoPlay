import { affixChannelBugtoServer, nextInQueue, sendFileToServer, sendTemplateToServer } from '$lib/caspercg.js';
import { json, text, redirect } from '@sveltejs/kit';

export async function POST({ request }) {
	const {video_channel,layer,clip,additionalArgs,playNow,type,stopAfterPlay,duration} = await request.json();
    console.log(type)
    if(type== 1) {
        let sRequest = await sendTemplateToServer(video_channel,layer,clip,playNow,stopAfterPlay,duration,additionalArgs);
        return json(sRequest)
    } else if (type == 2) {
        let sRequest = await affixChannelBugtoServer(video_channel,layer,clip);
        return json(sRequest)
    } else {
        let sRequest = await sendFileToServer(video_channel,layer,clip,additionalArgs,playNow);
        return json(sRequest)
    }
}