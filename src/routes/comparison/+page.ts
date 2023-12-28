import { dev } from '$app/environment';

// we don't need any JS on this page, though we'll load
// it in dev so that we get hot module replacement
export const csr = dev;

// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export async function load({ params }: any) {
  console.log(params);
	const res = await fetch(`http://127.0.0.1:8000/players/find-players-by-name/?name=Sidney`);
	const playerData = await res.json();
  console.log(playerData, "playerData")

	return { playerData };
}