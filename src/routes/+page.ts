import { api, endpoints } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	try {
		const data = await api<any>(endpoints.landing());
		return { landing: data };
	} catch (e) {
		return { landing: null, error: (e as Error).message };
	}
};
