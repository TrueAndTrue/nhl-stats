import { api, endpoints } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, setHeaders }) => {
	let data: any;
	try {
		data = await api<any>(endpoints.player(params.id));
	} catch (e) {
		throw error(404, (e as Error).message);
	}
	// Career stats change at most once per game day; let the CDN hold a copy for a day.
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800' });
	return { player: data };
};
