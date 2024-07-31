
import { removeMedia } from '$lib/database.js';
import { json, text, redirect } from '@sveltejs/kit';

export async function POST({ request }) {
	const {id} = await request.json();
        let sRequest = await removeMedia(id);
        return json(sRequest)
}