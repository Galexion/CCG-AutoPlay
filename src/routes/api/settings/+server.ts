import { getSettings, updateSettings } from '$lib/database.js';
import { json, text, redirect } from '@sveltejs/kit';

export async function GET({ request }) {
    return json(await getSettings())
}

export async function PATCH({ request }) {
    return json(await updateSettings(await request.json()))
}