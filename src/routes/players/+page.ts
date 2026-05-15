import { api, endpoints } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const qs = new URLSearchParams();
	for (const k of ['q', 'position', 'status', 'band', 'country', 'sort', 'page']) {
		const v = url.searchParams.get(k);
		if (v) qs.set(k, v);
	}
	try {
		const data = await api<any>(endpoints.players(qs.toString()));
		return { directory: data };
	} catch (e) {
		throw error(500, (e as Error).message);
	}
};
