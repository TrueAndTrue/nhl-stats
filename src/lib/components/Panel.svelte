<script lang="ts">
	export let title: string | undefined = undefined;
	export let subtitle: string | undefined = undefined;
	let cls = '';
	export { cls as class };
</script>

<div class="rounded-lg border border-line bg-panel {cls}">
	{#if title}
		<div class="flex items-center gap-3.5 border-b border-line px-[22px] py-4">
			<div class="font-mono text-[10px] uppercase tracking-[1.6px] text-dim2">{title}</div>
			{#if subtitle}
				<div class="font-body text-[12px] text-dim">{subtitle}</div>
			{/if}
			<div class="flex-1"></div>
			<slot name="action" />
		</div>
	{/if}
	<slot />
</div>
