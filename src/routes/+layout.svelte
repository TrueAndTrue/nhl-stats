<script>
	import '../app.pcss';
	import Header from './Header.svelte';
	import { inject } from '@vercel/analytics';
	import { dev } from '$app/environment';

	inject({mode: dev ? 'development' : 'production'});
</script>

<div class="app">
	<Header></Header>

	<main>
		<slot />
	</main>

	<footer class="text-white-950 text-sm">
		<p>Statistical Data provided by the National Hockey League (NHL). All rights reserved. This website is not affiliated with, endorsed by, or sponsored by the NHL.</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
		margin-top: 2%;
		color: white;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
