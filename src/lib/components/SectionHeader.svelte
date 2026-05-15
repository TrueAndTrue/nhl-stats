<script lang="ts">
	import Eyebrow from './Eyebrow.svelte';
	export let eyebrow: string | undefined = undefined;
	export let title: string;
	export let subtitle: string | undefined = undefined;
	export let kicker: string | undefined = undefined;
</script>

<div class="flex items-end justify-between gap-8 px-12 pb-7 pt-10">
	<div>
		{#if eyebrow}
			<div class="mb-3.5"><Eyebrow accent={kicker}>{eyebrow}</Eyebrow></div>
		{/if}
		<div class="font-display text-[44px] font-medium leading-[1.05] tracking-[-0.5px] text-ink">{title}</div>
		{#if subtitle}
			<div class="mt-2 max-w-[640px] font-body text-[15px] leading-[1.5] text-dim2">{subtitle}</div>
		{/if}
	</div>
	<slot name="action" />
</div>
