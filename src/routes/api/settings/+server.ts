import { getSettings } from '$lib/database.js';
import { json, text, redirect } from '@sveltejs/kit';

export async function GET({ request }) {
    return json(await getSettings())
}