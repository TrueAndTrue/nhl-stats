<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import Eyebrow from '$lib/components/Eyebrow.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	export let data: { directory: any };
	$: dir = data.directory;
	$: filters = dir.filters;

	const POSITIONS = [
		{ k: 'C', label: 'C' },
		{ k: 'L', label: 'LW' },
		{ k: 'R', label: 'RW' },
		{ k: 'D', label: 'D' },
		{ k: 'G', label: 'G' }
	];
	const STATUSES = [
		{ k: 'all', label: 'All' },
		{ k: 'active', label: 'Active' },
		{ k: 'retired', label: 'Retired' }
	];
	const BANDS = [
		{ k: 'all', label: 'Everyone' },
		{ k: 'hof', label: 'HOF' },
		{ k: 'top100', label: 'Top 100' }
	];
	const SORTS = [
		{ k: 'last_name', label: 'A–Z' },
		{ k: 'sweater', label: 'Sweater #' },
		{ k: 'active', label: 'Active first' }
	];

	const fmt = (n: number) => n.toLocaleString('en-US');

	function withParam(updates: Record<string, string | null>): string {
		const p = new URLSearchParams($page.url.searchParams);
		for (const [k, v] of Object.entries(updates)) {
			if (v === null || v === '') p.delete(k);
			else p.set(k, v);
		}
		// Any filter change resets to page 1
		if (!Object.keys(updates).includes('page')) p.delete('page');
		return p.toString();
	}

	function setParam(updates: Record<string, string | null>) {
		goto(`/players?${withParam(updates)}`, { keepFocus: true, noScroll: true });
	}

	let qInput = filters?.q ?? '';
	let qTimer: ReturnType<typeof setTimeout> | null = null;
	function onQ() {
		if (qTimer) clearTimeout(qTimer);
		qTimer = setTimeout(() => setParam({ q: qInput || null }), 220);
	}

	const POS_LABEL: Record<string, string> = { C: 'C', L: 'LW', R: 'RW', D: 'D', G: 'G' };

	$: pageNum = filters.page ?? 1;
	$: pageCount = dir.page_count ?? 1;

	function gotoPage(n: number) {
		if (n < 1 || n > pageCount) return;
		setParam({ page: String(n) });
	}
</script>

<svelte:head><title>Players · ANHLS</title></svelte:head>

<TopNav active="players" />

<!-- Hero -->
<div class="grid items-end gap-8 border-b border-line px-12 pb-10 pt-14" style="grid-template-columns: 1fr 480px;">
	<div>
		<Eyebrow>The roster · 8,660 names on file</Eyebrow>
		<div class="mt-4 max-w-[900px] font-display text-[72px] font-medium leading-[0.95] tracking-[-1.5px] text-ink">
			Every player <span class="text-dim">who ever logged a shift</span> in our event ledger.
		</div>
		<div class="mt-3 max-w-[820px] text-[13px] leading-[1.6] text-dim2">
			Search by name, narrow by position or country, jump to a profile. Includes {fmt(dir.facets.active)} active, {fmt(dir.facets.hof)} Hall-of-Famers, and the canonical {fmt(dir.facets.top100)} all-time.
		</div>
	</div>
	<div class="flex border border-line">
		{#each [
			{ l: 'TOTAL', v: fmt(dir.total) },
			{ l: 'PAGE', v: `${pageNum} / ${pageCount}` },
			{ l: 'SHOWN', v: String(dir.results.length) },
			{ l: 'POSITION', v: (filters.position ?? 'ANY') }
		] as f, i}
			<div class="flex-1 bg-panel px-4 py-3 {i < 3 ? 'border-r border-line' : ''}">
				<div class="font-mono text-[9px] tracking-[1.4px] text-dim">{f.l}</div>
				<div class="mt-1 font-body text-[13px] font-medium text-ink">{f.v}</div>
			</div>
		{/each}
	</div>
</div>

<!-- Filter bar -->
<div class="grid items-center gap-4 border-b border-line bg-bgDeep px-12 py-3.5" style="grid-template-columns: 280px 1fr auto;">
	<input
		type="search"
		bind:value={qInput}
		on:input={onQ}
		placeholder="Filter by name…"
		class="rounded-md border border-line bg-panel px-3 py-2 font-body text-[13px] text-ink placeholder:text-dim focus:border-lineHard"
	/>
	<div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-[1.2px] font-mono">
		<div class="flex items-center gap-1.5">
			<span class="text-dim">POS</span>
			<button class={`rounded-[3px] border px-2 py-[3px] ${!filters.position ? 'border-ink text-ink' : 'border-line text-dim hover:text-ink'}`} on:click={() => setParam({ position: null })}>ANY</button>
			{#each POSITIONS as p}
				<button class={`rounded-[3px] border px-2 py-[3px] ${filters.position === p.k ? 'border-red bg-redDim text-red' : 'border-line text-dim hover:text-ink'}`} on:click={() => setParam({ position: p.k })}>{p.label}</button>
			{/each}
		</div>
		<div class="flex items-center gap-1.5">
			<span class="text-dim">STATUS</span>
			{#each STATUSES as s}
				<button class={`rounded-[3px] border px-2 py-[3px] ${filters.status === s.k ? 'border-ink text-ink' : 'border-line text-dim hover:text-ink'}`} on:click={() => setParam({ status: s.k === 'all' ? null : s.k })}>{s.label}</button>
			{/each}
		</div>
		<div class="flex items-center gap-1.5">
			<span class="text-dim">BAND</span>
			{#each BANDS as b}
				<button class={`rounded-[3px] border px-2 py-[3px] ${filters.band === b.k ? 'border-warn text-warn' : 'border-line text-dim hover:text-ink'}`} on:click={() => setParam({ band: b.k === 'all' ? null : b.k })}>{b.label}</button>
			{/each}
		</div>
		<div class="flex items-center gap-1.5">
			<span class="text-dim">SORT</span>
			{#each SORTS as s}
				<button class={`rounded-[3px] border px-2 py-[3px] ${(filters.sort ?? 'last_name') === s.k ? 'border-ink text-ink' : 'border-line text-dim hover:text-ink'}`} on:click={() => setParam({ sort: s.k === 'last_name' ? null : s.k })}>{s.label}</button>
			{/each}
		</div>
	</div>
	<Tag color="#ec3a3a">● {fmt(dir.total)} match</Tag>
</div>

<!-- Quick-jump country chips -->
{#if dir.facets.country?.length}
	<div class="flex flex-wrap items-center gap-2 border-b border-line bg-bgDeep px-12 py-2.5 font-mono text-[10px] tracking-[1.2px]">
		<span class="text-dim">TOP COUNTRIES</span>
		<button class={`rounded-[3px] border px-2 py-[3px] ${!filters.country ? 'border-ink text-ink' : 'border-line text-dim hover:text-ink'}`} on:click={() => setParam({ country: null })}>ANY</button>
		{#each dir.facets.country as c}
			<button class={`rounded-[3px] border px-2 py-[3px] ${filters.country === c.birth_country ? 'border-ice text-ice' : 'border-line text-dim hover:text-ink'}`} on:click={() => setParam({ country: c.birth_country })}>{c.birth_country} · {fmt(c.n)}</button>
		{/each}
	</div>
{/if}

<!-- Grid -->
{#if dir.results.length}
	<div class="grid grid-cols-5 border-b border-line">
		{#each dir.results as p, i}
			<a
				href={`/player/${p.id}`}
				class="group relative flex flex-col border-line {i % 5 !== 4 ? 'border-r' : ''} {Math.floor(i / 5) < Math.ceil(dir.results.length / 5) - 1 ? 'border-b' : ''} bg-panel hover:bg-panel2"
			>
				<div class="relative aspect-[4/5] overflow-hidden" style="background-image: linear-gradient(135deg, #161b25 0%, #070910 100%), repeating-linear-gradient(45deg, transparent 0 8px, #13192340 8px 9px);">
					{#if p.headshot_url}
						<img src={p.headshot_url} alt={p.full_name} loading="lazy" class="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:opacity-100" />
					{/if}
					<div class="absolute inset-x-0 bottom-0 flex items-end justify-between p-3" style="background: linear-gradient(180deg, transparent, #070910);">
						<div class="font-display font-semibold leading-[0.85] text-red" style="font-size:48px; letter-spacing:-2px;">
							{p.sweater_number ?? '—'}
						</div>
						<div class="text-right">
							{#if p.team_abbrev}
								<div class="font-mono text-[9px] tracking-[1.4px] text-ink2">{p.team_abbrev}</div>
							{/if}
							<div class="font-mono text-[9px] tracking-[1.4px] text-dim">{POS_LABEL[p.position] ?? p.position}{p.birth_country ? ` · ${p.birth_country}` : ''}</div>
						</div>
					</div>
					{#if p.in_hhof}
						<div class="absolute right-2 top-2 font-mono text-[10px] tracking-[1.2px] text-warn">★ HOF</div>
					{:else if p.in_top_100}
						<div class="absolute right-2 top-2 font-mono text-[10px] tracking-[1.2px] text-warn">★ T100</div>
					{:else if p.is_active}
						<div class="absolute right-2 top-2 font-mono text-[9px] tracking-[1.2px] text-red">● ACTIVE</div>
					{/if}
				</div>
				<div class="px-3 py-3">
					<div class="font-body text-[11px] text-dim2">{p.first_name}</div>
					<div class="truncate font-display text-[20px] leading-tight tracking-[-0.5px] text-ink">{p.last_name?.toUpperCase()}</div>
					<div class="mt-1 font-mono text-[9px] tracking-[0.8px] text-dim">#{p.id}{p.birth_year ? ` · b. ${p.birth_year}` : ''}</div>
				</div>
			</a>
		{/each}
	</div>
{:else}
	<div class="px-12 py-20 text-center">
		<div class="font-display text-[32px] text-dim">No players match.</div>
		<div class="mt-2 font-mono text-[10px] tracking-[1.2px] text-faint">Loosen a filter, or clear the search.</div>
	</div>
{/if}

<!-- Pagination -->
{#if pageCount > 1}
	<div class="flex items-center justify-between border-b border-line bg-bgDeep px-12 py-4 font-mono text-[10px] tracking-[1.2px] text-dim">
		<div>PAGE {pageNum} OF {fmt(pageCount)} · {fmt(dir.total)} TOTAL</div>
		<div class="flex items-center gap-2">
			<button class={`rounded-[3px] border px-2.5 py-1 ${pageNum > 1 ? 'border-line text-dim hover:text-ink' : 'cursor-not-allowed border-line opacity-30'}`} on:click={() => gotoPage(1)} disabled={pageNum <= 1}>« FIRST</button>
			<button class={`rounded-[3px] border px-2.5 py-1 ${pageNum > 1 ? 'border-line text-dim hover:text-ink' : 'cursor-not-allowed border-line opacity-30'}`} on:click={() => gotoPage(pageNum - 1)} disabled={pageNum <= 1}>‹ PREV</button>
			<button class={`rounded-[3px] border px-2.5 py-1 ${pageNum < pageCount ? 'border-line text-dim hover:text-ink' : 'cursor-not-allowed border-line opacity-30'}`} on:click={() => gotoPage(pageNum + 1)} disabled={pageNum >= pageCount}>NEXT ›</button>
			<button class={`rounded-[3px] border px-2.5 py-1 ${pageNum < pageCount ? 'border-line text-dim hover:text-ink' : 'cursor-not-allowed border-line opacity-30'}`} on:click={() => gotoPage(pageCount)} disabled={pageNum >= pageCount}>LAST »</button>
		</div>
	</div>
{/if}

<StatusBar note={`players directory · ${fmt(dir.total)} matched · page ${pageNum}/${pageCount}`} />
