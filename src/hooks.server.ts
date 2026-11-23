import type { Handle } from '@sveltejs/kit/hooks';

const CANONICAL_ORIGIN = 'https://www.anhls.com';

// Hosts that should redirect to the canonical domain instead of rendering.
// Crawlers find the default *.vercel.app hostname and hammer it; sending them
// to www.anhls.com puts every page view behind the same CDN cache and firewall rules.
const REDIRECT_HOSTS = new Set(['nhl-stats.vercel.app']);

// Default CDN caching for rendered pages that don't set their own Cache-Control.
// Browsers always revalidate (max-age=0); Vercel's CDN serves a shared copy for
// 10 minutes and keeps serving it for a day while it refreshes in the background.
const DEFAULT_PAGE_CACHE = 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400';

export const handle: Handle = async ({ event, resolve }) => {
	if (REDIRECT_HOSTS.has(event.url.host)) {
		return new Response(null, {
			status: 308,
			headers: {
				location: CANONICAL_ORIGIN + event.url.pathname + event.url.search,
				'cache-control': 'public, max-age=86400, s-maxage=86400'
			}
		});
	}

	const response = await resolve(event);

	if (
		event.request.method === 'GET' &&
		response.status === 200 &&
		!response.headers.has('cache-control') &&
		response.headers.get('content-type')?.startsWith('text/html')
	) {
		response.headers.set('cache-control', DEFAULT_PAGE_CACHE);
	}

	return response;
};
