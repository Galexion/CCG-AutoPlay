
import { updateSetting } from '$lib/database.js';
import { json, text, redirect } from '@sveltejs/kit';

export async function POST({ request }) {
	const {data,setting} = await request.json();
        let sRequest = await updateSetting(setting,data);
        return json(sRequest)
}