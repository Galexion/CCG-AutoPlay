
import { queueMedia } from '$lib/database.js';
import { json, text, redirect } from '@sveltejs/kit';

export async function POST({ request }) {
	const {clip,type,duration} = await request.json();
        let sRequest = await queueMedia(clip,type,duration);
        return json(sRequest)
}