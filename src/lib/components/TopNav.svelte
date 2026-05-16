<script lang="ts">
	import Mark from './Mark.svelte';
	import { api, endpoints } from '$lib/api';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	export let active: 'home' | 'players' | 'compare' | 'versus' | 'games' | 'records' | 'rink' | 'era' = 'home';

	const items = [
		{ id: 'home', label: 'Home', href: '/' },
		{ id: 'players', label: 'Players', href: '/players' },
		{ id: 'compare', label: 'Compare', href: '/comparison' },
		{ id: 'versus', label: 'Versus', href: '/versus' },
		{ id: 'games', label: 'Games', href: '/games' },
		{ id: 'records', label: 'Records', href: '/records' },
		{ id: 'rink', label: 'Rink Lab', href: '/rink-lab' },
		{ id: 'era', label: 'Eras', href: '/eras' }
	] as const;

	let searchEl: HTMLInputElement | null = null;
	let q = '';
	let suggestions: any[] = [];
	let open = false;
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	async function runSearch(text: string) {
		if (text.trim().length < 2) {
			suggestions = [];
			open = false;
			return;
		}
		try {
			const res = await api<any>(endpoints.playerSearch(text));
			suggestions = res.results ?? [];
			open = suggestions.length > 0;
		} catch {
			suggestions = [];
			open = false;
		}
	}

	function onInput() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => runSearch(q), 180);
	}

	function pick(p: any) {
		open = false;
		q = '';
		suggestions = [];
		goto(`/player/${p.id}`);
	}

	function onKeydown(ev: KeyboardEvent) {
		if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
			ev.preventDefault();
			searchEl?.focus();
			searchEl?.select();
		}
		if (ev.key === 'Escape') {
			open = false;
			searchEl?.blur();
		}
		if (ev.key === 'Enter' && document.activeElement === searchEl && suggestions.length) {
			ev.preventDefault();
			pick(suggestions[0]);
		}
	}

	onMount(() => {
		window.addEventListener('keydown', onKeydown);
	});
	onDestroy(() => {
		if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);
	});
</script>

<div class="flex items-center gap-10 border-b border-line bg-bgDeep px-12 py-5 font-body">
	<a href="/" class="flex items-center gap-3">
		<Mark />
		<div class="flex flex-col gap-[1px]">
			<div class="font-display text-[22px] font-semibold leading-none tracking-wider text-ink">ANHLS</div>
			<div class="font-mono text-[9px] tracking-[1.2px] text-dim">ADVANCED NHL STATS</div>
		</div>
	</a>

	<div class="ml-4 flex gap-7">
		{#each items as i (i.id)}
			<a
				href={i.href}
				class="relative pb-1 text-[13px] font-medium {i.id === active ? 'text-ink' : 'text-dim hover:text-ink2'}"
			>
				{i.label}
				{#if i.id === active}
					<div class="absolute -bottom-[22px] left-0 right-0 h-[2px] bg-red"></div>
				{/if}
			</a>
		{/each}
	</div>

	<div class="flex-1"></div>

	<div class="relative w-80">
		<div class="flex items-center gap-2.5 rounded-md border border-line bg-panel px-3.5 py-[9px] font-body text-[13px] text-ink focus-within:border-lineHard">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-dim">
				<circle cx="11" cy="11" r="7" />
				<path d="m21 21-4.3-4.3" />
			</svg>
			<input
				bind:this={searchEl}
				bind:value={q}
				on:input={onInput}
				on:focus={() => { if (suggestions.length) open = true; }}
				on:blur={() => setTimeout(() => (open = false), 120)}
				type="search"
				placeholder="Search player…"
				class="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-dim"
			/>
			<span class="rounded-[3px] bg-bgDeep px-1.5 py-[2px] font-mono text-[10px] text-dim2">⌘K</span>
		</div>
		{#if open}
			<div class="absolute left-0 right-0 top-full z-40 mt-1 max-h-[420px] overflow-y-auto rounded-md border border-line bg-panel shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
				{#each suggestions as s}
					<button
						type="button"
						on:mousedown|preventDefault={() => pick(s)}
						class="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-panel2"
					>
						<span class="text-[13px] text-ink">{s.full_name}</span>
						<span class="font-mono text-[10px] text-dim">{s.position}{s.is_active ? ' · ACT' : ''} · #{s.id}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

</div>
