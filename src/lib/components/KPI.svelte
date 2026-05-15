<script lang="ts">
	export let value: string | number;
	export let label: string;
	export let sub: string | undefined = undefined;
	export let accent: string | undefined = undefined;
	export let size = 40;
</script>

<div>
	<div
		class="font-display font-medium tnum"
		style:font-size="{size}px"
		style:line-height="1"
		style:color={accent ?? '#f4f5f7'}
		style:letter-spacing="-1px"
	>
		{value}
	</div>
	{#if sub}
		<div class="mt-1.5 font-body text-[12px] text-dim2">{sub}</div>
	{/if}
	<div class="mt-2 font-mono text-[10px] uppercase tracking-[1.4px] text-dim">{label}</div>
</div>
