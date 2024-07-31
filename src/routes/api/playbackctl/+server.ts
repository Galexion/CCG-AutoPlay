import { clearChannel, sendFileToServer, nextInQueue } from '$lib/caspercg.js';
import { json, text, redirect } from '@sveltejs/kit';

export async function POST({ request }) {
	const {type} = await request.json();
    if (type == 4) {
        clearChannel(1)
    }else if (type == 3) {
        let sRequest = await nextInQueue();
        return json(sRequest)
    } 
    let sRequest = await sendFileToServer(type);
    return json(sRequest)
}