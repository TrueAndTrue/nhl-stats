<script lang="ts">
	export let color: string | undefined = undefined;
	export let accent: string | false | undefined = undefined;
</script>

<div class="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[1.8px]" style:color={color ?? '#7c8595'}>
	{#if accent !== false}
		<span class="h-px w-[18px]" style:background={(typeof accent === 'string' ? accent : null) ?? '#ec3a3a'}></span>
	{/if}
	<slot />
</div>
