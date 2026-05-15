import { api, endpoints } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return { eras: await api<any>(endpoints.eras()) };
};
