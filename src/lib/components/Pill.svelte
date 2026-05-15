<script lang="ts">
	export let active = false;
	export let onClick: (() => void) | undefined = undefined;
</script>

<button
	type="button"
	on:click={onClick}
	class="cursor-pointer rounded-full border px-3 py-1.5 font-body text-[12px] font-medium transition-colors"
	class:border-ink={active}
	class:bg-ink={active}
	class:text-bgDeep={active}
	class:border-line={!active}
	class:text-dim2={!active}
	class:hover:text-ink={!active}
>
	<slot />
</button>
