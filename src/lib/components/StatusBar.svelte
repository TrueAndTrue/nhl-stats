<script lang="ts">
	export let note = 'synced 04:12 UTC · postgres · live';
	export let stats: [string, string][] = [
		['69,712', 'games'],
		['7.11M', 'events'],
		['8,660', 'players'],
		['1.16M', 'shot coords'],
		['108', 'seasons']
	];
</script>

<div class="flex items-center gap-7 border-t border-line bg-bgDeep px-12 py-3.5 font-mono text-[10px] tracking-[1px] text-dim">
	{#each stats as [v, l], i}
		<span class="flex gap-1.5">
			<span class="text-ink2">{v}</span>
			<span class="text-dim">{l}</span>
			{#if i < stats.length - 1}
				<span class="ml-[18px] text-faint">·</span>
			{/if}
		</span>
	{/each}
	<div class="flex-1"></div>
	<span class="text-dim2">{note}</span>
</div>
