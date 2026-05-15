<script lang="ts">
	import '../app.pcss';
	import { inject } from '@vercel/analytics';
	import { dev } from '$app/environment';

	inject({ mode: dev ? 'development' : 'production' });
</script>

<div class="flex min-h-screen flex-col bg-bg text-ink">
	<slot />
</div>
