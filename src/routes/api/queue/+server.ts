import { getQueue } from '$lib/database.js';
import { json, text, redirect } from '@sveltejs/kit';

export async function POST({ request }) {
    return json(await getQueue())
}