<script lang="ts">
	export let primary = false;
	export let ghost = false;
	export let small = false;
	export let href: string | undefined = undefined;
	$: pad = small ? 'px-3.5 py-2' : 'px-5 py-3';
	$: size = small ? 'text-[12px]' : 'text-[13px]';
	$: cls = primary
		? `bg-red text-ink border-0 rounded-md ${pad} ${size} font-medium cursor-pointer hover:bg-[#d83232] transition-colors`
		: ghost
			? `bg-transparent text-dim2 border-0 rounded-md ${pad} ${size} font-medium cursor-pointer hover:text-ink transition-colors`
			: `bg-transparent text-ink border border-lineHard rounded-md ${pad} ${size} font-medium cursor-pointer hover:border-dim2 transition-colors`;
</script>

{#if href}
	<a {href} class={cls} role="button">
		<slot />
	</a>
{:else}
	<button type="button" class={cls} on:click>
		<slot />
	</button>
{/if}
