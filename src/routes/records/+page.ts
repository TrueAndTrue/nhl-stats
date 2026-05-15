import { api, endpoints } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const category = url.searchParams.get('category') ?? 'goals';
	const band = url.searchParams.get('band') ?? 'all';
	const [records, overview] = await Promise.all([
		api<any>(endpoints.records(category, `band=${band}`)),
		api<any>(endpoints.recordsOverview())
	]);
	return { records, overview };
};
