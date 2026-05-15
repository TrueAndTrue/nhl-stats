<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import Eyebrow from '$lib/components/Eyebrow.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	export let data: { records: any; overview: any };
	$: r = data.records;
	$: lb = r.leaderboard as Array<any>;
	$: top5 = lb.slice(0, 5);
	$: overview = data.overview ?? { leaders: [], goal_types: [] };
	$: leadersByCategory = Object.fromEntries(
		((overview.leaders ?? []) as Array<any>).map((l) => [l.category, l])
	);
	$: goalTypes = ((overview.goal_types ?? []) as Array<{ shot_type: string; count: number }>)
		.slice()
		.sort((a, b) => b.count - a.count);
	$: maxGoalType = goalTypes.length ? goalTypes[0].count : 1;

	function prettyShotType(s: string): string {
		if (!s) return '';
		return s.replace(/[-_]/g, ' ');
	}

	const fmt = (n: number) => n.toLocaleString('en-US');

	const categories: { key: string; label: string }[] = [
		{ key: 'goals', label: 'CAREER GOALS' },
		{ key: 'assists', label: 'CAREER ASSISTS' },
		{ key: 'shots', label: 'CAREER SHOTS' },
		{ key: 'hits', label: 'CAREER HITS' },
		{ key: 'blocks', label: 'CAREER BLOCKS' },
		{ key: 'faceoffs', label: 'CAREER FACEOFFS' },
		{ key: 'penalties_drawn', label: 'CAREER PENALTIES DRAWN' }
	];

	function navTo(category: string, band: string) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('category', category);
		params.set('band', band);
		goto(`/records?${params.toString()}`);
	}

	$: currentCategory = $page.url.searchParams.get('category') ?? 'goals';
	$: currentBand = $page.url.searchParams.get('band') ?? 'all';

	// Career span — for the YEARS column
	const MIN_YEAR = 1917;
	const MAX_YEAR = 2026;
</script>

<svelte:head><title>Records · ANHLS</title></svelte:head>

<TopNav active="records" />

<!-- HERO -->
<div class="grid items-end gap-8 border-b border-line px-12 pb-10 pt-16" style="grid-template-columns: 1fr 480px;">
	<div>
		<Eyebrow>The ledger</Eyebrow>
		<div class="mt-5 max-w-[900px] font-display text-[88px] font-medium tracking-[-2px] text-ink" style="line-height:1.04; padding-bottom:0.08em">
			Every record we can compute,<span class="text-dim"> queried live against 7,112,166 events.</span>
		</div>
	</div>
	<div class="flex border border-line">
		{#each [{ l: 'CATEGORY', v: r.label?.toUpperCase() ?? 'GOALS' }, { l: 'ERA', v: 'ALL-TIME' }, { l: 'BAND', v: r.band?.toUpperCase() ?? 'ALL' }, { l: 'POS', v: 'ANY' }] as f, i}
			<div class="flex-1 bg-panel px-[18px] py-3.5 {i < 3 ? 'border-r border-line' : ''}">
				<div class="font-mono text-[9px] tracking-[1.4px] text-dim">{f.l}</div>
				<div class="mt-1 font-body text-[13px] font-medium text-ink">{f.v} ▾</div>
			</div>
		{/each}
	</div>
</div>

<!-- Category switcher -->
<div class="flex flex-wrap items-center gap-2 border-b border-line bg-bgDeep px-12 py-3">
	<span class="mr-3 font-mono text-[10px] tracking-[1.6px] text-dim">CATEGORY</span>
	{#each categories as c}
		<button
			class="rounded-md border px-3 py-1 font-mono text-[10px] tracking-[1.2px] hover:text-ink"
			class:border-ink={currentCategory === c.key}
			class:text-ink={currentCategory === c.key}
			class:border-line={currentCategory !== c.key}
			class:text-dim={currentCategory !== c.key}
			on:click={() => navTo(c.key, currentBand)}
		>
			{c.label}
		</button>
	{/each}
</div>

<!-- Top 5 cards -->
<div class="grid grid-cols-5 border-b border-line">
	{#each top5 as p, i}
		<div
			class="relative overflow-hidden px-[22px] pb-[18px] pt-[22px] {i < 4 ? 'border-r border-line' : ''}"
			style:background={i === 0 ? 'linear-gradient(180deg, #0b0e14, #070910)' : '#0b0e14'}
		>
			<div
				class="pointer-events-none absolute font-display"
				style="right:-14px; top:-22px; font-size:128px; line-height:1; letter-spacing:-6px; color:{i === 0 ? '#ec3a3a' : '#7c8595'}; opacity:{i === 0 ? 0.18 : 0.1}"
			>
				{p.rank}
			</div>
			<div class="relative font-mono text-[10px] tracking-[1.4px] text-dim">
				#{p.rank} · {p.position}
				{#if p.active}
					<span class="ml-2 text-red">● ACTIVE</span>
				{/if}
			</div>
			<div class="relative mt-3.5 font-display text-[26px] text-dim2">{p.first_name}</div>
			<div class="relative font-display text-[38px] leading-none tracking-[-0.5px] text-ink">{p.last_name?.toUpperCase()}</div>
			<div
				class="tnum relative mt-4 font-display"
				style="font-size:60px; line-height:1; padding-bottom:0.08em; color:{i === 0 ? '#ec3a3a' : '#f4f5f7'}"
			>
				{fmt(p.value)}
			</div>
			<div class="relative mt-1 font-mono text-[9px] text-dim">{r.label?.toUpperCase()}</div>
		</div>
	{/each}
</div>

<!-- Main grid -->
<div class="grid" style="grid-template-columns: 1fr 380px;">
	<div class="border-r border-line">
		<div class="flex items-center gap-4 border-b border-line px-6 py-3.5">
			<div class="font-mono text-[10px] uppercase tracking-[1.6px] text-dim2">{r.label?.toUpperCase()} · TOP 30</div>
			<div class="flex-1"></div>
			<button on:click={() => navTo(currentCategory, 'all')} class={`rounded-[3px] border px-2 py-1 font-mono text-[10px] tracking-[1.2px] ${currentBand === 'all' ? 'border-ink text-ink' : 'border-line text-dim'}`}>SHOW ALL</button>
			<button on:click={() => navTo(currentCategory, 'hof')} class={`rounded-[3px] border px-2 py-1 font-mono text-[10px] tracking-[1.2px] ${currentBand === 'hof' ? 'border-ink text-ink' : 'border-line text-dim'}`}>HOF ONLY</button>
			<button on:click={() => navTo(currentCategory, 'active')} class={`rounded-[3px] border px-2 py-1 font-mono text-[10px] tracking-[1.2px] ${currentBand === 'active' ? 'border-ink text-ink' : 'border-line text-dim'}`}>ACTIVE ONLY</button>
		</div>

		<!-- Table header -->
		<div
			class="grid border-b border-line px-6 py-2.5 font-mono text-[9px] tracking-[1.4px] text-dim"
			style="grid-template-columns: 50px 1fr 60px 100px 1fr;"
		>
			<span>#</span><span>PLAYER</span><span>POS</span><span>{r.label?.toUpperCase() ?? 'VALUE'}</span><span>CAREER SPAN</span>
		</div>

		{#each lb as row, i}
			{@const x1 = row.start_year ? ((row.start_year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100 : 0}
			{@const x2 = row.end_year ? ((row.end_year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100 : x1}
			<a
				href={`/player/${row.id}`}
				class="grid items-center px-6 py-2 font-mono text-[12px] hover:bg-panel"
				style="grid-template-columns: 50px 1fr 60px 100px 1fr; border-bottom: 1px solid #13192340;"
				style:color={row.active ? '#f4f5f7' : '#cfd3da'}
				style:background={i === 0 ? 'rgba(236,58,58,0.05)' : 'transparent'}
			>
				<span style:color={i < 3 ? '#ec3a3a' : '#7c8595'}>{row.rank}</span>
				<span class="text-ink">
					{#if row.hhof}<span class="mr-1.5 text-warn">★</span>{/if}
					{row.last_name}, {row.first_name}
					{#if row.active}<span class="ml-2 text-[9px] text-red">●</span>{/if}
				</span>
				<span>{row.position}</span>
				<span class="tnum text-ink">{fmt(row.value)}</span>
				<span class="flex items-center gap-2 text-[10px]">
					<span class="relative h-[4px] flex-1" style="background:#13192340">
						<span class="absolute bottom-0 top-0" style:left="{x1}%" style:width="{Math.max(2, x2 - x1)}%" style:background={row.active ? '#ec3a3a' : '#6dc9ff'} style:opacity="0.7"></span>
					</span>
					<span class="text-dim">{row.start_year ?? '—'}–{row.end_year ?? '—'}</span>
				</span>
			</a>
		{/each}
	</div>

	<div>
		<Panel title="ALSO QUERY" class="rounded-none border-0 border-b border-line">
			<div class="py-1">
				{#each categories.filter((c) => c.key !== currentCategory).slice(0, 6) as alt}
					{@const leader = leadersByCategory[alt.key]}
					<button class="block w-full px-[18px] py-2.5 text-left hover:bg-panel2" style="border-bottom: 1px solid #13192340;" on:click={() => navTo(alt.key, currentBand)}>
						<div class="font-mono text-[9px] tracking-[1.2px] text-dim">{alt.label}</div>
						{#if leader && leader.player}
							<div class="mt-1 flex items-baseline justify-between gap-3">
								<span class="text-[13px] text-ink">{leader.player.last_name}</span>
								<span class="tnum font-mono text-[12px] text-dim2">· {fmt(leader.value)}</span>
							</div>
						{:else}
							<div class="mt-1 text-[13px] text-ink">Switch view →</div>
						{/if}
					</button>
				{/each}
			</div>
		</Panel>

		<Panel title="GOAL TYPE BREAKDOWN" class="rounded-none border-0 border-b border-line">
			<div class="px-[18px] py-3">
				{#each goalTypes as gt, i}
					{@const pct = (gt.count / maxGoalType) * 100}
					<div class="py-2" style={i < goalTypes.length - 1 ? 'border-bottom: 1px solid #13192340;' : ''}>
						<div class="flex items-baseline justify-between gap-3">
							<span class="font-mono text-[10px] uppercase tracking-[1.2px] text-dim2">{prettyShotType(gt.shot_type)}</span>
							<span class="tnum font-mono text-[12px] text-ink">{fmt(gt.count)}</span>
						</div>
						<div class="mt-1.5 h-[4px] w-full" style="background:#13192340">
							<div class="h-full" style:width="{pct}%" style:background={i === 0 ? '#ec3a3a' : '#6dc9ff'} style:opacity={i === 0 ? 0.9 : 0.55}></div>
						</div>
					</div>
				{/each}
			</div>
		</Panel>
	</div>
</div>

<StatusBar note={`QUERY · records.${currentCategory} · live`} />
