<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import Eyebrow from '$lib/components/Eyebrow.svelte';
	import Rink from '$lib/components/Rink.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import { api, endpoints } from '$lib/api';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	let aId = 8478402; // McDavid
	let bId = 8471675; // Crosby
	let aQ = 'McDavid';
	let bQ = 'Crosby';
	let aSuggestions: any[] = [];
	let bSuggestions: any[] = [];
	let data: any = null;
	let loading = false;
	let error: string | null = null;
	let gameType: 'all' | 'regular' | 'playoffs' = 'all';

	$: gameType = (($page.url.searchParams.get('game_type') as any) ?? 'all') as any;
	$: {
		const ap = Number($page.url.searchParams.get('a') ?? '0');
		const bp = Number($page.url.searchParams.get('b') ?? '0');
		if (ap && ap !== aId) aId = ap;
		if (bp && bp !== bId) bId = bp;
	}
	$: if (browser) { aId; bId; fetchCompare(); }

	type GT = 'all' | 'regular' | 'playoffs';
	function setGameType(v: GT | string) {
		const params = new URLSearchParams($page.url.searchParams);
		if (v === 'all') params.delete('game_type');
		else params.set('game_type', v);
		goto(`/comparison?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	async function fetchCompare() {
		if (!aId || !bId) return;
		loading = true;
		error = null;
		try {
			const qs: Record<string, string> = {};
			if (gameType && gameType !== 'all') qs.game_type = gameType;
			data = await api<any>(endpoints.comparison(aId, bId, qs));
		} catch (e) {
			error = (e as Error).message;
			data = null;
		} finally {
			loading = false;
		}
	}

	$: if (browser) { gameType; fetchCompare(); }

	async function search(q: string, side: 'a' | 'b') {
		if (q.length < 2) {
			if (side === 'a') aSuggestions = [];
			else bSuggestions = [];
			return;
		}
		try {
			const res = await api<any>(endpoints.playerSearch(q));
			if (side === 'a') aSuggestions = res.results;
			else bSuggestions = res.results;
		} catch {}
	}

	// Reactive statement above triggers fetchCompare; keep onMount only for first load if needed.

	const fmt = (n: number) => (Number.isInteger(n) ? n.toLocaleString('en-US') : n);

	function pick(side: 'a' | 'b', p: any) {
		if (side === 'a') {
			aId = p.id;
			aQ = p.last_name;
			aSuggestions = [];
		} else {
			bId = p.id;
			bQ = p.last_name;
			bSuggestions = [];
		}
		fetchCompare();
	}

	// Stat row config — winner is computed from data
	function avgDistance(shots: any[]): number {
		if (!shots.length) return 0;
		const sum = shots.reduce((acc, x) => acc + Math.hypot(89 - Math.abs(x.coord_x), x.coord_y), 0);
		return Math.round(sum / shots.length);
	}
	$: aDist = data ? avgDistance(data.a_shots) : 0;
	$: bDist = data ? avgDistance(data.b_shots) : 0;

	function arcMaxFor(d: any): number {
		if (!d) return 30;
		const gs: number[] = [...d.a_arc.map((r: any) => r.g), ...d.b_arc.map((r: any) => r.g), 30];
		// 10% headroom so the peak label and dot stay inside the chart area.
		return Math.ceil((Math.max(...gs) * 1.1) / 5) * 5;
	}
	function arcPathBuilder(arcMax: number, step: number, height: number) {
		return (arr: any[]) =>
			arr
				.map((r, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - (r.g / arcMax) * height}`)
				.join(' ');
	}

	// Career-arc chart helpers
	function arcPeak(arr: any[]): any | null {
		if (!arr || !arr.length) return null;
		return arr.reduce((best, r) => (r.g > best.g ? r : best), arr[0]);
	}
	function seasonLabel(year: number): string {
		return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
	}
	// Choose a round step for the Y-axis gridlines so labels don't look arbitrary.
	function niceStep(max: number): number {
		const candidates = [5, 10, 15, 20, 25, 50];
		for (const c of candidates) if (max / c <= 5) return c;
		return Math.ceil(max / 5 / 10) * 10;
	}

	// Hover state for the career-arc overlay
	const ARC_W = 1200;
	const ARC_H = 260;
	let arcHoverIdx: number | null = null;

	function arcCareerTotal(arr: any[]): number {
		return arr.reduce((s, r) => s + (r.g ?? 0), 0);
	}
	function arcGridlines(arcMax: number): number[] {
		const step = niceStep(arcMax);
		const out: number[] = [];
		for (let v = step; v < arcMax * 0.95; v += step) out.push(v);
		return out;
	}
	function onArcMove(ev: MouseEvent, yearsMax: number, step: number) {
		const target = ev.currentTarget as SVGGraphicsElement;
		const rect = target.getBoundingClientRect();
		if (!rect.width) return;
		const xPx = ev.clientX - rect.left;
		const xSvg = (xPx / rect.width) * ARC_W;
		const idx = Math.max(0, Math.min(yearsMax - 1, Math.round(xSvg / step)));
		arcHoverIdx = idx;
	}
	function onArcLeave() {
		arcHoverIdx = null;
	}

	$: rows = data
		? [
				{ label: 'GOALS', a: data.a_stats.goals, b: data.b_stats.goals },
				{ label: 'ASSISTS', a: data.a_stats.assists, b: data.b_stats.assists },
				{ label: 'SHOTS ON GOAL', a: data.a_stats.sog, b: data.b_stats.sog },
				{ label: 'SHOOTING %', a: data.a_stats.sh_pct, b: data.b_stats.sh_pct, suffix: '%' },
				{ label: 'HITS DELIVERED', a: data.a_stats.hits_delivered, b: data.b_stats.hits_delivered },
				{ label: 'HITS TAKEN', a: data.a_stats.hits_taken, b: data.b_stats.hits_taken, lowerIsBetter: true },
				{ label: 'FACEOFF WINS', a: data.a_stats.faceoff_wins, b: data.b_stats.faceoff_wins },
				{ label: 'FACEOFF %', a: data.a_stats.faceoff_pct, b: data.b_stats.faceoff_pct, suffix: '%' },
				{ label: 'BLOCKED SHOTS', a: data.a_stats.blocked, b: data.b_stats.blocked },
				{ label: 'MISSED SHOTS', a: data.a_stats.missed_shots, b: data.b_stats.missed_shots, lowerIsBetter: true },
				{ label: 'PENALTIES TAKEN', a: data.a_stats.pen_taken, b: data.b_stats.pen_taken, lowerIsBetter: true },
				{ label: 'PENALTIES DRAWN', a: data.a_stats.pen_drawn, b: data.b_stats.pen_drawn },
				{ label: 'GIVEAWAYS', a: data.a_stats.giveaways, b: data.b_stats.giveaways, lowerIsBetter: true },
				{ label: 'TAKEAWAYS', a: data.a_stats.takeaways, b: data.b_stats.takeaways },
				{ label: 'POINTS', a: data.a_stats.points, b: data.b_stats.points }
			]
		: [];
</script>

<svelte:head><title>Compare · ANHLS</title></svelte:head>

<TopNav active="compare" />

<!-- Hero -->
<div class="border-b border-line px-12 pb-8 pt-12">
	<Eyebrow>Side-by-side · 15 categories · live query</Eyebrow>
	<div class="mt-4 max-w-[1100px] font-display text-[64px] font-medium leading-none tracking-[-1.5px] text-ink">
		Two skaters, line by line.<span class="text-dim"> Career, era, situation — pick the lens.</span>
	</div>
</div>

<!-- Search bar -->
<div class="grid items-center gap-6 border-b border-line bg-bgDeep px-12 py-4" style="grid-template-columns: 1fr 80px 1fr;">
	<div class="relative">
		<input
			bind:value={aQ}
			on:input={() => search(aQ, 'a')}
			class="w-full rounded-md border border-line bg-panel px-3 py-2 font-body text-[13px] text-ink placeholder:text-dim"
			placeholder="Search player A — last name"
		/>
		{#if aSuggestions.length}
			<div class="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-line bg-panel">
				{#each aSuggestions as s}
					<button class="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-panel2" on:click={() => pick('a', s)}>
						{s.full_name} <span class="font-mono text-[10px] text-dim">#{s.id} · {s.position}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
	<div class="text-center font-display text-[24px] text-dim">VS</div>
	<div class="relative">
		<input
			bind:value={bQ}
			on:input={() => search(bQ, 'b')}
			class="w-full rounded-md border border-line bg-panel px-3 py-2 font-body text-[13px] text-ink placeholder:text-dim"
			placeholder="Search player B — last name"
		/>
		{#if bSuggestions.length}
			<div class="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-line bg-panel">
				{#each bSuggestions as s}
					<button class="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-panel2" on:click={() => pick('b', s)}>
						{s.full_name} <span class="font-mono text-[10px] text-dim">#{s.id} · {s.position}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Filter bar -->
<div class="flex items-center border-b border-line bg-bgDeep px-12 py-4">
	<div class="mr-6 font-mono text-[10px] tracking-[1.6px] text-dim">FILTERS</div>
	<div class="px-[18px] py-1">
		<div class="font-mono text-[9px] tracking-[1.4px] text-dim">SEASONS</div>
		<div class="mt-1 font-body text-[13px] font-medium text-ink">CAREER · ALL</div>
	</div>
	<div class="border-l border-line px-[18px] py-1">
		<div class="font-mono text-[9px] tracking-[1.4px] text-dim">GAME TYPE</div>
		<div class="mt-1 flex gap-1.5">
			{#each [{ v: 'all', l: 'REG + PO' }, { v: 'regular', l: 'REG ONLY' }, { v: 'playoffs', l: 'PLAYOFFS' }] as opt}
				<button
					type="button"
					on:click={() => setGameType(opt.v)}
					class="rounded-[3px] border px-2 py-[2px] font-mono text-[10px] tracking-[1.2px] {gameType === opt.v ? 'border-red bg-redDim text-red' : 'border-line text-dim hover:text-ink'}"
				>{opt.l}</button>
			{/each}
		</div>
	</div>
	{#each [
		{ l: 'STRENGTH', v: 'ALL' },
		{ l: 'ZONE', v: 'ALL' },
		{ l: 'PERIOD', v: 'ALL' },
		{ l: 'OPPONENT', v: 'ANY' }
	] as f}
		<div class="border-l border-line px-[18px] py-1">
			<div class="font-mono text-[9px] tracking-[1.4px] text-dim">{f.l}</div>
			<div class="mt-1 font-body text-[13px] font-medium text-dim2">{f.v} ▾</div>
		</div>
	{/each}
	<div class="flex-1"></div>
	{#if data}
		<Tag color="#ec3a3a">● live query · {data.a.full_name} vs {data.b.full_name}{gameType !== 'all' ? ` · ${gameType.toUpperCase()}` : ''}</Tag>
	{/if}
</div>

{#if loading}
	<div class="px-12 py-16 text-center text-dim">Loading…</div>
{:else if error}
	<div class="px-12 py-16 text-center text-red">{error}</div>
{:else if data}
	<!-- Player headers -->
	<div class="grid border-b border-line" style="grid-template-columns: 1fr 80px 1fr;">
		<div class="flex flex-row items-center gap-6 px-7 py-5">
			<div
				class="relative aspect-square w-20 border border-line bg-panel"
				style="background-image: repeating-linear-gradient(45deg, transparent 0 6px, #13192340 6px 7px);"
			>
				<div class="absolute inset-0 flex items-center justify-center font-display text-[44px] text-red">
					{data.a.sweater_number ?? '—'}
				</div>
			</div>
			<div class="flex-1 text-left">
				<div class="mb-1.5 flex justify-start gap-2">
					<Tag>{data.a.position}</Tag>
					<Tag color="#ec3a3a">{data.a.is_active ? 'ACTIVE' : 'RETIRED'}</Tag>
				</div>
				<div class="font-mono text-[11px] tracking-[1.4px] text-dim">{data.a.first_name?.toUpperCase()}</div>
				<div class="font-display text-[64px] leading-[0.95] tracking-[-1px] text-red">{data.a.last_name?.toUpperCase()}</div>
			</div>
		</div>
		<div class="flex items-center justify-center border-l border-r border-line font-display text-[36px] tracking-[1px] text-dim">VS</div>
		<div class="flex flex-row-reverse items-center gap-6 px-7 py-5">
			<div
				class="relative aspect-square w-20 border border-line bg-panel"
				style="background-image: repeating-linear-gradient(45deg, transparent 0 6px, #13192340 6px 7px);"
			>
				<div class="absolute inset-0 flex items-center justify-center font-display text-[44px] text-ice">
					{data.b.sweater_number ?? '—'}
				</div>
			</div>
			<div class="flex-1 text-right">
				<div class="mb-1.5 flex justify-end gap-2">
					<Tag>{data.b.position}</Tag>
					<Tag color="#6dc9ff">{data.b.is_active ? 'ACTIVE' : 'RETIRED'}</Tag>
				</div>
				<div class="font-mono text-[11px] tracking-[1.4px] text-dim">{data.b.first_name?.toUpperCase()}</div>
				<div class="font-display text-[64px] leading-[0.95] tracking-[-1px] text-ice">{data.b.last_name?.toUpperCase()}</div>
			</div>
		</div>
	</div>

	<!-- Stat table -->
	<div class="border-b border-line">
		{#each rows as r, i}
			{@const aN = typeof r.a === 'number' ? r.a : 0}
			{@const bN = typeof r.b === 'number' ? r.b : 0}
			{@const aWins = r.lowerIsBetter ? aN < bN : aN > bN}
			{@const bWins = r.lowerIsBetter ? bN < aN : bN > aN}
			{@const max = Math.max(aN, bN, 1)}
			<div class="grid items-stretch" style="grid-template-columns: 1fr 220px 1fr; border-bottom: {i === rows.length - 1 ? 'none' : '1px solid #13192340'};">
				<!-- A side -->
				<div class="flex items-center justify-end gap-3.5 px-7 py-3.5">
					{#if !aWins}
						<div class="relative h-[4px] w-[120px] overflow-hidden bg-[#13192340]">
							<div class="absolute bottom-0 right-0 top-0 bg-dim" style:width="{(aN / max) * 100}%"></div>
						</div>
					{/if}
					<span class="tnum relative font-display text-[32px]" style:color={aWins ? '#ec3a3a' : '#a4abb8'}>
						{fmt(r.a)}{r.suffix ?? ''}
						{#if aWins}
							<span class="pointer-events-none absolute left-1/2 top-1/2 h-[180%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-red"></span>
						{/if}
					</span>
				</div>
				<div class="flex items-center justify-center border-l border-r border-line bg-panel py-3.5 font-mono text-[10px] tracking-[1.6px] text-dim">
					{r.label}
				</div>
				<div class="flex items-center gap-3.5 px-7 py-3.5">
					<span class="tnum relative font-display text-[32px]" style:color={bWins ? '#ec3a3a' : '#a4abb8'}>
						{fmt(r.b)}{r.suffix ?? ''}
						{#if bWins}
							<span class="pointer-events-none absolute left-1/2 top-1/2 h-[180%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-red"></span>
						{/if}
					</span>
					{#if !bWins}
						<div class="relative h-[4px] w-[120px] overflow-hidden bg-[#13192340]">
							<div class="absolute bottom-0 left-0 top-0 bg-dim" style:width="{(bN / max) * 100}%"></div>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Shot maps overlay -->
	<Panel title="SHOT MAPS · OVERLAID" subtitle="all shots · career" class="rounded-none border-0 border-b border-line">
		<svelte:fragment slot="action">
			<Tag color="#ec3a3a" bg="rgba(236,58,58,0.15)">● {data.a.last_name?.toUpperCase()}</Tag>
			<Tag color="#6dc9ff" bg="rgba(109,201,255,0.15)">● {data.b.last_name?.toUpperCase()}</Tag>
		</svelte:fragment>
		<div class="grid gap-6 p-6" style="grid-template-columns: 1fr 1fr 320px;">
			{#each [{ shots: data.a_shots, color: '#ec3a3a', label: data.a.last_name }, { shots: data.b_shots, color: '#6dc9ff', label: data.b.last_name }] as side}
				<div>
					<div class="mb-2 font-mono text-[10px] tracking-[1.6px]" style:color={side.color}>
						{side.label.toUpperCase()} · {fmt(side.shots.length)} SHOTS
					</div>
					<div class="relative">
						<Rink width={460} />
						<svg width="460" height={460 * 85 / 200} viewBox="0 0 200 85" class="absolute inset-0">
							{#each side.shots as s}
								{@const x = s.coord_x < 0 ? -s.coord_x : s.coord_x}
								{@const y = s.coord_x < 0 ? -s.coord_y : s.coord_y}
								<circle cx={100 + x} cy={42.5 + y} r="0.45" fill={side.color} opacity={s.type_desc === 'goal' ? 0.7 : 0.2} />
							{/each}
						</svg>
					</div>
				</div>
			{/each}
			<!-- delta panel -->
			<div class="border border-line bg-panel2 p-4">
				<div class="mb-3.5 font-mono text-[10px] tracking-[1.6px] text-dim2">SPATIAL DELTA</div>
				<div class="mb-4">
					<div class="font-mono text-[9px] tracking-[1.2px] text-dim">AVG SHOT DISTANCE</div>
					<div class="mt-1 flex items-baseline gap-2.5">
						<span class="font-display text-[36px] text-red">{aDist}<span class="text-[16px] text-dim">ft</span></span>
						<span class="font-mono text-[10px] text-dim">vs</span>
						<span class="font-display text-[36px] text-ice">{bDist}<span class="text-[16px] text-dim">ft</span></span>
					</div>
				</div>
				<div class="mb-4">
					<div class="font-mono text-[9px] tracking-[1.2px] text-dim">SAMPLE SIZES</div>
					<div class="mt-1 flex items-baseline gap-2.5">
						<span class="font-display text-[28px] text-red">{fmt(data.a_shots.length)}</span>
						<span class="font-mono text-[10px] text-dim">vs</span>
						<span class="font-display text-[28px] text-ice">{fmt(data.b_shots.length)}</span>
					</div>
				</div>
			</div>
		</div>
	</Panel>

	<!-- Career arc overlay -->
	<Panel title="GOALS PER SEASON · CAREER OVERLAY" subtitle="rookie season = Y1 · hover to scrub" class="rounded-none border-0 border-b border-line">
		{@const yearsMax = Math.max(data.a_arc.length, data.b_arc.length, 2)}
		{@const arcMax = arcMaxFor(data)}
		{@const step = ARC_W / (yearsMax - 1)}
		{@const pathFor = arcPathBuilder(arcMax, step, ARC_H)}
		{@const aPeak = arcPeak(data.a_arc)}
		{@const bPeak = arcPeak(data.b_arc)}
		{@const aLast = data.a_arc[data.a_arc.length - 1]}
		{@const bLast = data.b_arc[data.b_arc.length - 1]}
		{@const aCareer = arcCareerTotal(data.a_arc)}
		{@const bCareer = arcCareerTotal(data.b_arc)}
		{@const gridlines = arcGridlines(arcMax)}
		{@const hovA = arcHoverIdx != null && arcHoverIdx < data.a_arc.length ? data.a_arc[arcHoverIdx] : null}
		{@const hovB = arcHoverIdx != null && arcHoverIdx < data.b_arc.length ? data.b_arc[arcHoverIdx] : null}

		<div class="px-6 pt-5">
			<!-- Inline legend -->
			<div class="mb-4 grid gap-4" style="grid-template-columns: 1fr 1fr;">
				<div class="flex items-baseline gap-3">
					<span class="inline-block h-[3px] w-7 rounded-[2px] bg-red"></span>
					<span class="font-display text-[18px] tracking-[-0.5px] text-ink">{data.a.last_name}</span>
					<span class="font-mono text-[10px] tracking-[1.2px] text-dim">
						Y1–Y{data.a_arc.length}{aLast ? ` · ${seasonLabel(aLast.year)}` : ''}
					</span>
					<span class="flex-1"></span>
					<span class="font-mono text-[10px] tracking-[1.2px] text-dim2">
						Peak <span class="text-red">{aPeak?.g ?? 0}G</span>{aPeak ? ` · Y${data.a_arc.indexOf(aPeak) + 1} · ${seasonLabel(aPeak.year)}` : ''} · Career <span class="text-ink">{fmt(aCareer)}G</span>
					</span>
				</div>
				<div class="flex items-baseline gap-3">
					<span class="inline-block h-[3px] w-7 rounded-[2px] bg-ice"></span>
					<span class="font-display text-[18px] tracking-[-0.5px] text-ink">{data.b.last_name}</span>
					<span class="font-mono text-[10px] tracking-[1.2px] text-dim">
						Y1–Y{data.b_arc.length}{bLast ? ` · ${seasonLabel(bLast.year)}` : ''}
					</span>
					<span class="flex-1"></span>
					<span class="font-mono text-[10px] tracking-[1.2px] text-dim2">
						Peak <span class="text-ice">{bPeak?.g ?? 0}G</span>{bPeak ? ` · Y${data.b_arc.indexOf(bPeak) + 1} · ${seasonLabel(bPeak.year)}` : ''} · Career <span class="text-ink">{fmt(bCareer)}G</span>
					</span>
				</div>
			</div>

			<!-- Chart -->
			<div class="relative">
				<svg
					width={ARC_W}
					height={ARC_H + 44}
					viewBox={`0 0 ${ARC_W} ${ARC_H + 44}`}
					class="block w-full"
					role="img"
					aria-label={`Goals-per-season overlay: ${data.a.last_name} vs ${data.b.last_name}, aligned by rookie year.`}
					on:mousemove={(e) => onArcMove(e, yearsMax, step)}
					on:mouseleave={onArcLeave}
				>
					<!-- Y baseline (0G) -->
					<line x1="0" y1={ARC_H} x2={ARC_W} y2={ARC_H} stroke="#222a3a" stroke-width="0.6" />
					<text x={ARC_W - 24} y={ARC_H - 3} font-family="JetBrains Mono, monospace" font-size="9" fill="#7c8595">0G</text>

					<!-- Y gridlines (rounded) -->
					{#each gridlines as g}
						<line x1="0" y1={ARC_H - (g / arcMax) * ARC_H} x2={ARC_W} y2={ARC_H - (g / arcMax) * ARC_H} stroke="#1a2030" stroke-width="0.5" stroke-dasharray="2 3" />
						<text x={ARC_W - 24} y={ARC_H - (g / arcMax) * ARC_H - 3} font-family="JetBrains Mono, monospace" font-size="9" fill="#7c8595">{g}G</text>
					{/each}

					<!-- B (ice) line — drawn first so red lays on top -->
					<path d={pathFor(data.b_arc)} fill="none" stroke="#6dc9ff" stroke-width="2" opacity="0.9" stroke-linejoin="round" stroke-linecap="round" />
					{#each data.b_arc as r, i}
						{@const isPeak = bPeak && i === data.b_arc.indexOf(bPeak)}
						<circle cx={i * step} cy={ARC_H - (r.g / arcMax) * ARC_H} r={isPeak ? 4.5 : 2.5} fill="#6dc9ff" stroke="#0b0e14" stroke-width={isPeak ? 1.5 : 0} />
						{#if isPeak}
							<text x={i * step} y={ARC_H - (r.g / arcMax) * ARC_H - 10} font-family="Antonio, sans-serif" font-size="16" font-weight="500" fill="#6dc9ff" text-anchor="middle">{r.g}G</text>
						{/if}
					{/each}
					{#if bLast}
						<text x={(data.b_arc.length - 1) * step + 8} y={ARC_H - (bLast.g / arcMax) * ARC_H + 4} font-family="JetBrains Mono, monospace" font-size="10" font-weight="500" fill="#6dc9ff">{data.b.last_name.toUpperCase()} · {bLast.g}G</text>
					{/if}

					<!-- A (red) line -->
					<path d={pathFor(data.a_arc)} fill="none" stroke="#ec3a3a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />
					{#each data.a_arc as r, i}
						{@const isPeak = aPeak && i === data.a_arc.indexOf(aPeak)}
						<circle cx={i * step} cy={ARC_H - (r.g / arcMax) * ARC_H} r={isPeak ? 5 : 3} fill="#ec3a3a" stroke="#0b0e14" stroke-width={isPeak ? 1.5 : 0} />
						{#if isPeak}
							<text x={i * step} y={ARC_H - (r.g / arcMax) * ARC_H - 12} font-family="Antonio, sans-serif" font-size="18" font-weight="500" fill="#ec3a3a" text-anchor="middle">{r.g}G</text>
						{/if}
					{/each}
					{#if aLast}
						<text x={(data.a_arc.length - 1) * step + 8} y={ARC_H - (aLast.g / arcMax) * ARC_H - 6} font-family="JetBrains Mono, monospace" font-size="10" font-weight="500" fill="#ec3a3a">{data.a.last_name.toUpperCase()} · {aLast.g}G</text>
					{/if}

					<!-- Hover guide -->
					{#if arcHoverIdx != null}
						<line x1={arcHoverIdx * step} y1="0" x2={arcHoverIdx * step} y2={ARC_H} stroke="#f4f5f7" stroke-width="0.6" stroke-dasharray="2 3" opacity="0.5" />
						{#if hovA}
							<circle cx={arcHoverIdx * step} cy={ARC_H - (hovA.g / arcMax) * ARC_H} r="6" fill="none" stroke="#ec3a3a" stroke-width="1.5" />
						{/if}
						{#if hovB}
							<circle cx={arcHoverIdx * step} cy={ARC_H - (hovB.g / arcMax) * ARC_H} r="5" fill="none" stroke="#6dc9ff" stroke-width="1.5" />
						{/if}
					{/if}

					<!-- X-axis: every 5th year + endpoints -->
					{#each Array(yearsMax) as _, i}
						{#if i === 0 || i === yearsMax - 1 || (i + 1) % 5 === 0}
							<text x={i * step} y={ARC_H + 18} font-family="JetBrains Mono, monospace" font-size="10" fill="#7c8595" text-anchor="middle">Y{i + 1}</text>
						{/if}
					{/each}
					<text x="0" y={ARC_H + 34} font-family="JetBrains Mono, monospace" font-size="9" fill="#4a5160">ROOKIE YEAR</text>
					<text x={ARC_W} y={ARC_H + 34} font-family="JetBrains Mono, monospace" font-size="9" fill="#4a5160" text-anchor="end">YEAR {yearsMax}</text>
				</svg>

				<!-- Hover tooltip -->
				{#if arcHoverIdx != null && (hovA || hovB)}
					{@const left = Math.min(Math.max((arcHoverIdx * step) / ARC_W * 100, 6), 78)}
					<div class="pointer-events-none absolute top-2 z-10 rounded-md border border-lineHard bg-bgDeep px-3 py-2 font-mono text-[11px] text-ink2 shadow-[0_8px_24px_rgba(0,0,0,0.6)]" style="left:{left}%">
						<div class="mb-1 text-[9px] uppercase tracking-[1.4px] text-dim">Year {arcHoverIdx + 1}</div>
						{#if hovA}
							<div class="flex items-baseline gap-2">
								<span class="text-red">●</span>
								<span class="text-dim2">{data.a.last_name}</span>
								<span class="text-dim">{seasonLabel(hovA.year)}</span>
								<span class="text-ink"><span class="text-red">{hovA.g}</span>G</span>
							</div>
						{:else}
							<div class="flex items-baseline gap-2 opacity-50">
								<span class="text-red">●</span>
								<span class="text-dim2">{data.a.last_name}</span>
								<span class="text-faint">{data.a.is_active ? `still active · Y${data.a_arc.length} latest` : (aLast ? `retired after Y${data.a_arc.length}` : '—')}</span>
							</div>
						{/if}
						{#if hovB}
							<div class="flex items-baseline gap-2">
								<span class="text-ice">●</span>
								<span class="text-dim2">{data.b.last_name}</span>
								<span class="text-dim">{seasonLabel(hovB.year)}</span>
								<span class="text-ink"><span class="text-ice">{hovB.g}</span>G</span>
							</div>
						{:else}
							<div class="flex items-baseline gap-2 opacity-50">
								<span class="text-ice">●</span>
								<span class="text-dim2">{data.b.last_name}</span>
								<span class="text-faint">{data.b.is_active ? `still active · Y${data.b_arc.length} latest` : (bLast ? `retired after Y${data.b_arc.length}` : '—')}</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</Panel>
{/if}

<StatusBar note="QUERY · live · comparison endpoint" />
