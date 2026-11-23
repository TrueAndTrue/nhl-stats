import { api, endpoints } from '#lib/api.ts';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const DAY = 86400;
const FINAL_STATES = new Set(['OFF', 'FINAL']);

// Completed games never change, so the CDN can keep them for a month and every
// repeat visit (or crawler pass over the archive) skips the function and the API.
// Recent or in-progress games get a short TTL so scores stay fresh.
function cacheControlFor(game: { state?: string; date?: string } | undefined): string {
	const playedAt = game?.date ? Date.parse(game.date) : NaN;
	const settled =
		FINAL_STATES.has(game?.state ?? '') && !Number.isNaN(playedAt) && Date.now() - playedAt > 2 * DAY * 1000;
	return settled
		? `public, max-age=0, s-maxage=${30 * DAY}, stale-while-revalidate=${30 * DAY}`
		: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300';
}

export const load: PageLoad = async ({ params, setHeaders }) => {
	let game: any;
	try {
		game = await api<any>(endpoints.game(params.id));
	} catch (e) {
		throw error(404, (e as Error).message);
	}
	// setHeaders only applies during SSR; it's a no-op on client-side navigation.
	setHeaders({ 'cache-control': cacheControlFor(game?.game) });
	return { game };
};
