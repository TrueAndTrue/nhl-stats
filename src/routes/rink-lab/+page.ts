import { api, endpoints } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const bins = await api<any>(endpoints.rinkLab('bin=4&era=modern'));
	// Initial selected bin — Ovi's office area (mirrored to right side: x≈68, y≈-22)
	const initialBin = await api<any>(endpoints.rinkBin(68, -24));
	return { bins, initialBin };
};
