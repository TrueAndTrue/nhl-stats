import { api, endpoints } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	try {
		return { game: await api<any>(endpoints.game(params.id)) };
	} catch (e) {
		throw error(404, (e as Error).message);
	}
};
