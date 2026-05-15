import { api, endpoints } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	try {
		const data = await api<any>(endpoints.player(params.id));
		return { player: data };
	} catch (e) {
		throw error(404, (e as Error).message);
	}
};
