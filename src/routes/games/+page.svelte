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

	const GAME_TYPE_LABEL: Record<number, string> = {
		1: 'Preseason',
		2: 'Regular',
		3: 'Playoffs',
		4: 'All-Star'
	};
	const SORTS = [
		{ k: 'date_desc', label: 'Newest' },
		{ k: 'date_asc', label: 'Oldest' },
		{ k: 'score_high', label: 'Highest scoring' }
	];

	const fmt = (n: number) => n.toLocaleString('en-US');
	function seasonLabel(s: number) {
		if (!s) return '';
		const yr = Math.floor(s / 10000);
		return `${yr}-${String((yr + 1) % 100).padStart(2, '0')}`;
	}

	function withParam(updates: Record<string, string | null>): string {
		const p = new URLSearchParams($page.url.searchParams);
		for (const [k, v] of Object.entries(updates)) {
			if (v === null || v === '') p.delete(k);
			else p.set(k, v);
		}
		if (!Object.keys(updates).includes('page')) p.delete('page');
		return p.toString();
	}
	function setParam(updates: Record<string, string | null>) {
		goto(`/games?${withParam(updates)}`, { keepFocus: true, noScroll: true });
	}

	$: pageNum = filters.page ?? 1;
	$: pageCount = dir.page_count ?? 1;

	function gotoPage(n: number) {
		if (n < 1 || n > pageCount) return;
		setParam({ page: String(n) });
	}

	function onSelectChange(key: string, ev: Event) {
		const v = (ev.currentTarget as HTMLSelectElement).value;
		setParam({ [key]: v || null });
	}

	// Group rows by date for the slab presentation.
	$: grouped = (() => {
		const buckets: Array<{ date: string; rows: any[] }> = [];
		for (const r of dir.results) {
			const d = r.game_date ?? '—';
			let last = buckets[buckets.length - 1];
			if (!last || last.date !== d) {
				last = { date: d, rows: [] };
				buckets.push(last);
			}
			last.rows.push(r);
		}
		return buckets;
	})();

	function fmtDate(s: string | null): string {
		if (!s) return '—';
		try {
			const [y, m, d] = s.split('-').map(Number);
			const dt = new Date(Date.UTC(y, m - 1, d));
			return dt.toLocaleDateString('en-US', {
				timeZone: 'UTC',
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return s;
		}
	}

	function winner(g: any): 'home' | 'away' | null {
		if (g.home_score == null || g.away_score == null) return null;
		if (g.home_score === g.away_score) return null;
		return g.home_score > g.away_score ? 'home' : 'away';
	}

	const RECENT_TEAMS = ['ANA', 'BOS', 'BUF', 'CAR', 'CBJ', 'CGY', 'CHI', 'COL', 'DAL', 'DET', 'EDM', 'FLA', 'LAK', 'MIN', 'MTL', 'NJD', 'NSH', 'NYI', 'NYR', 'OTT', 'PHI', 'PIT', 'SEA', 'SJS', 'STL', 'TBL', 'TOR', 'UTA', 'VAN', 'VGK', 'WPG', 'WSH'];
	$: historicalTeams = (dir?.facets?.teams ?? []).filter((t: string) => !RECENT_TEAMS.includes(t));
</script>

<svelte:head><title>Games · ANHLS</title></svelte:head>

<TopNav active="games" />

<!-- Hero -->
<div class="grid items-end gap-8 border-b border-line px-12 pb-10 pt-14" style="grid-template-columns: 1fr 540px;">
	<div>
		<Eyebrow>The schedule · 69,712 games on file</Eyebrow>
		<div class="mt-4 max-w-[900px] font-display text-[72px] font-medium leading-[0.95] tracking-[-1.5px] text-ink">
			Every game <span class="text-dim">from the inaugural 1917 schedule</span> through last night.
		</div>
		<div class="mt-3 max-w-[820px] text-[13px] leading-[1.6] text-dim2">
			Pick a season, filter to a team, or scrub by date. Click any row for the full shot map and play-by-play.
		</div>
	</div>
	<div class="flex border border-line">
		{#each [
			{ l: 'TOTAL', v: fmt(dir.total) },
			{ l: 'PAGE', v: `${pageNum} / ${fmt(pageCount)}` },
			{ l: 'SHOWN', v: String(dir.results.length) },
			{ l: 'SEASON', v: filters.season ? seasonLabel(filters.season) : 'ALL' }
		] as f, i}
			<div class="flex-1 bg-panel px-4 py-3 {i < 3 ? 'border-r border-line' : ''}">
				<div class="font-mono text-[9px] tracking-[1.4px] text-dim">{f.l}</div>
				<div class="mt-1 font-body text-[13px] font-medium text-ink">{f.v}</div>
			</div>
		{/each}
	</div>
</div>

<!-- Filter bar -->
<div class="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-bgDeep px-12 py-3.5 font-mono text-[10px] uppercase tracking-[1.2px]">
	<div class="flex items-center gap-1.5">
		<span class="text-dim">SEASON</span>
		<select
			class="rounded-[3px] border border-line bg-panel px-2 py-[3px] text-ink"
			value={filters.season ?? ''}
			on:change={(e) => onSelectChange('season', e)}
		>
			<option value="">ALL · {fmt(dir.total)}</option>
			{#each dir.facets.seasons as s}
				<option value={s}>{seasonLabel(s)}</option>
			{/each}
		</select>
	</div>

	<div class="flex items-center gap-1.5">
		<span class="text-dim">GAME TYPE</span>
		<button class={`rounded-[3px] border px-2 py-[3px] ${!filters.game_type ? 'border-ink text-ink' : 'border-line text-dim hover:text-ink'}`} on:click={() => setParam({ game_type: null })}>ANY</button>
		{#each [{ k: 2, l: 'REG' }, { k: 3, l: 'PLAYOFFS' }, { k: 1, l: 'PRE' }, { k: 4, l: 'ALL-STAR' }] as t}
			<button
				class={`rounded-[3px] border px-2 py-[3px] ${filters.game_type === t.k ? 'border-red bg-redDim text-red' : 'border-line text-dim hover:text-ink'}`}
				on:click={() => setParam({ game_type: String(t.k) })}
			>{t.l}</button>
		{/each}
	</div>

	<div class="flex items-center gap-1.5">
		<span class="text-dim">TEAM</span>
		<select
			class="rounded-[3px] border border-line bg-panel px-2 py-[3px] text-ink"
			value={filters.team ?? ''}
			on:change={(e) => onSelectChange('team', e)}
		>
			<option value="">ANY</option>
			<optgroup label="Current 32">
				{#each RECENT_TEAMS as t}
					<option value={t}>{t}</option>
				{/each}
			</optgroup>
			<optgroup label="All teams (incl. historical)">
				{#each historicalTeams as t}
					<option value={t}>{t}</option>
				{/each}
			</optgroup>
		</select>
	</div>

	<div class="flex items-center gap-1.5">
		<span class="text-dim">SORT</span>
		{#each SORTS as s}
			<button
				class={`rounded-[3px] border px-2 py-[3px] ${(filters.sort ?? 'date_desc') === s.k ? 'border-ink text-ink' : 'border-line text-dim hover:text-ink'}`}
				on:click={() => setParam({ sort: s.k === 'date_desc' ? null : s.k })}
			>{s.label}</button>
		{/each}
	</div>

	<div class="flex-1"></div>
	<Tag color="#ec3a3a">● {fmt(dir.total)} match</Tag>
</div>

<!-- Game rows, grouped by date -->
{#if dir.results.length}
	{#each grouped as bucket}
		<div class="grid border-b border-line" style="grid-template-columns: 220px 1fr;">
			<div class="border-r border-line bg-bgDeep px-8 py-5">
				<div class="font-mono text-[9px] tracking-[1.4px] text-dim">DATE</div>
				<div class="mt-1 font-display text-[22px] tracking-[-0.5px] text-ink">{fmtDate(bucket.date)}</div>
				<div class="mt-1 font-mono text-[10px] tracking-[1.2px] text-dim">{bucket.rows.length} GAME{bucket.rows.length === 1 ? '' : 'S'}</div>
			</div>
			<div>
				{#each bucket.rows as g, idx}
					{@const w = winner(g)}
					<a
						href={`/game/${g.id}`}
						class="grid items-center gap-4 px-8 py-3.5 hover:bg-panel"
						style="grid-template-columns: 80px 1fr 120px 90px 120px 80px; border-bottom: {idx < bucket.rows.length - 1 ? '1px solid #13192340' : 'none'};"
					>
						<div class="font-mono text-[10px] tracking-[1.2px] text-dim">{seasonLabel(g.season)}</div>
						<div class="font-mono text-[10px] tracking-[1.2px] text-dim">{GAME_TYPE_LABEL[g.game_type] ?? '—'}</div>
						<div class="flex items-center justify-end gap-3">
							<span class="font-display text-[24px] tracking-[-0.5px] {w === 'away' ? 'text-ink' : 'text-dim2'}">{g.away_team}</span>
							<span class="tnum font-display text-[28px] tracking-[-1px] {w === 'away' ? 'text-red' : 'text-dim2'}">{g.away_score ?? '–'}</span>
						</div>
						<div class="text-center font-mono text-[10px] tracking-[1.2px] text-dim">@</div>
						<div class="flex items-center gap-3">
							<span class="tnum font-display text-[28px] tracking-[-1px] {w === 'home' ? 'text-red' : 'text-dim2'}">{g.home_score ?? '–'}</span>
							<span class="font-display text-[24px] tracking-[-0.5px] {w === 'home' ? 'text-ink' : 'text-dim2'}">{g.home_team}</span>
						</div>
						<div class="text-right">
							{#if g.game_state === 'LIVE'}
								<Tag color="#8de2a8" bg="rgba(141,226,168,0.15)">● LIVE</Tag>
							{:else if g.game_state === 'FUT'}
								<Tag color="#a4abb8">SCHEDULED</Tag>
							{:else if g.game_state === 'OFF' || g.game_state === 'FINAL' || g.game_state === 'OVER'}
								<Tag>FINAL</Tag>
							{:else}
								<Tag color="#7c8595">{g.game_state ?? '—'}</Tag>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/each}
{:else}
	<div class="px-12 py-20 text-center">
		<div class="font-display text-[32px] text-dim">No games match.</div>
		<div class="mt-2 font-mono text-[10px] tracking-[1.2px] text-faint">Loosen a filter and try again.</div>
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

<StatusBar note={`games directory · ${fmt(dir.total)} matched · page ${pageNum}/${fmt(pageCount)}`} />
