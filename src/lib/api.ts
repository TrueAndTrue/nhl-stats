import { dev } from '$app/environment';

const PROD_BASE = import.meta.env.VITE_NHL_API_BASE_URL ?? 'https://nhl-api.herokuapp.com';
const DEV_BASE = 'http://127.0.0.1:8000';

export const API_BASE = dev ? DEV_BASE : PROD_BASE;

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
	const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
	const res = await fetch(url, { ...init, headers: { Accept: 'application/json', ...(init?.headers ?? {}) } });
	if (!res.ok) throw new Error(`API ${res.status} ${res.statusText} — ${url}`);
	return (await res.json()) as T;
}

export const endpoints = {
	landing: () => '/api/landing/',
	players: (qs = '') => `/api/players/${qs ? '?' + qs : ''}`,
	player: (id: number | string) => `/api/players/${id}/`,
	playerSearch: (q: string) => `/api/players/search/?q=${encodeURIComponent(q)}`,
	games: (qs = '') => `/api/games/${qs ? '?' + qs : ''}`,
	comparison: (a: number, b: number, qs: Record<string, string> = {}) =>
		`/api/comparison/?a=${a}&b=${b}${Object.entries(qs).length ? '&' + new URLSearchParams(qs).toString() : ''}`,
	versus: (skater: number, goalie: number, qs: Record<string, string> = {}) =>
		`/api/versus/?skater=${skater}&goalie=${goalie}${Object.entries(qs).length ? '&' + new URLSearchParams(qs).toString() : ''}`,
	records: (category = 'goals', qs = '') => `/api/records/?category=${category}${qs ? '&' + qs : ''}`,
	recordsOverview: () => '/api/records/overview/',
	game: (id: number | string) => `/api/games/${id}/`,
	rinkLab: (qs = '') => `/api/rink-lab/${qs ? '?' + qs : ''}`,
	rinkBin: (x: number, y: number) => `/api/rink-lab/bin/?x=${x}&y=${y}`,
	eras: () => '/api/eras/'
};
