<script lang="ts">
	export let color: string | undefined = undefined;
	export let bg: string | undefined = undefined;
	export let solid = false;

	$: textColor = solid ? '#070910' : color ?? '#a4abb8';
	$: bgColor = solid ? color ?? '#f4f5f7' : bg ?? 'transparent';
	$: borderColor = solid ? 'transparent' : color ? `${color}40` : '#1a2030';
</script>

<span
	class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] border px-[9px] py-1 font-mono text-[10px] uppercase tracking-[1.2px]"
	style:color={textColor}
	style:background={bgColor}
	style:border-color={borderColor}
>
	<slot />
</span>
