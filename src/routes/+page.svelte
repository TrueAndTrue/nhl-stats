<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import Eyebrow from '$lib/components/Eyebrow.svelte';
	import Rink from '$lib/components/Rink.svelte';
	import StatNum from '$lib/components/StatNum.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import Cta from '$lib/components/Cta.svelte';

	export let data: { landing: any | null; error?: string };

	const fmt = (n: number) => n.toLocaleString('en-US');
	const fmtCompact = (n: number) => {
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
		return String(n);
	};

	$: counts = data?.landing?.counts ?? null;
	$: eraBuckets = data?.landing?.era_buckets ?? [];
	$: tonight = data?.landing?.tonight ?? [];
	$: tonightFallback = data?.landing?.tonight_fallback ?? false;
	$: tonightFallbackDate = data?.landing?.tonight_fallback_date as string | null;
	$: liveCount = tonight.filter((g: any) => g.state === 'LIVE').length;
	$: leaders = data?.landing?.leaders ?? [];
	$: ledger = (data?.landing?.ledger ?? []).filter(Boolean);
	$: currentSeasonLabel = data?.landing?.current_season_label ?? '';

	// Era bucket bar heights (log scale)
	$: maxLog = eraBuckets.length ? Math.max(...eraBuckets.map((e: any) => Math.log10(Math.max(1, e.events)))) : 1;

	// Density blobs for the shot-density signature (geometric, taste of real distribution)
	function generateBlobs() {
		const blobs: { x: number; y: number; r: number; o: number }[] = [];
		for (let i = 0; i < 70; i++) {
			const a = (i * 0.31) % (Math.PI * 2);
			const r = 6 + (i % 7);
			blobs.push({ x: 170 + Math.cos(a) * r * 0.5, y: 42.5 + Math.sin(a) * r * 0.4, r: 2.4 + (i % 3) * 0.5, o: 0.18 + (i % 4) * 0.05 });
			blobs.push({ x: 30 + Math.cos(a) * r * 0.5, y: 42.5 + Math.sin(a) * r * 0.4, r: 2.4 + (i % 3) * 0.5, o: 0.18 + (i % 4) * 0.05 });
		}
		for (let i = 0; i < 30; i++) {
			blobs.push({ x: 150 + (i % 6) * 6, y: 18 + Math.floor(i / 6) * 12, r: 1.6, o: 0.12 });
			blobs.push({ x: 18 + (i % 6) * 6, y: 18 + Math.floor(i / 6) * 12, r: 1.6, o: 0.12 });
		}
		for (let i = 0; i < 30; i++) {
			const a = (i * 0.5) % (Math.PI * 2);
			blobs.push({ x: 168 + Math.cos(a) * 3, y: 28 + Math.sin(a) * 2, r: 1.8, o: 0.28 });
		}
		return blobs;
	}
	const blobs = generateBlobs();

	// On-this-day — handpicked editorial set; data-driven version is future work
	const onThisDay = [
		{ y: 1971, t: 'Montréal wins the Cup vs. Chicago — Henri Richard ties series in OT' },
		{ y: 1989, t: 'Calgary closes out Montréal — first visiting team to raise the Cup on Forum ice' },
		{ y: 1994, t: 'Pavel Bure scores in the second OT vs. CGY for the series winner' },
		{ y: 2018, t: 'Vegas eliminates Winnipeg in their inaugural season' },
		{ y: 2024, t: 'NYR @ CAR Game 5 — 38 shots, 0 goals through regulation' }
	];

	$: pageCount = counts
		? {
				seasons: counts.seasons,
				games: fmt(counts.games),
				players: fmt(counts.players),
				shotCoords: fmtCompact(counts.shot_coords),
				hhof: counts.hhof,
				active: fmt(counts.active),
				events: fmt(counts.events)
			}
		: null;
</script>

<svelte:head>
	<title>ANHLS · Advanced NHL Stats</title>
</svelte:head>

<TopNav active="home" liveCount={liveCount} />

<!-- HERO -->
<div class="relative overflow-hidden border-b border-line">
	<div class="pointer-events-none absolute opacity-[0.18]" style="right:-120px; top:60px">
		<Rink width={920} />
	</div>

	<div class="relative max-w-[1100px] px-12 pb-16 pt-[88px]">
		<Eyebrow>A living record of every event in NHL history</Eyebrow>
		<div
			class="tnum mt-7 font-display font-medium leading-none text-ink"
			style="font-size:168px; letter-spacing:-4px; padding-bottom:0.12em"
		>
			{pageCount ? pageCount.events : '7,112,166'}
		</div>
		<div
			class="mt-8 max-w-[920px] font-display font-light text-dim2"
			style="font-size:32px; line-height:1.2; letter-spacing:-0.3px"
		>
			individual events — every shift, every shot, every penalty —<span class="text-ink"> from December 19, 1917 to last night.</span>
		</div>
		<div class="mt-11 flex gap-3">
			<Cta primary href="/players">Open a player →</Cta>
			<Cta href="/rink-lab">Explore the Rink Lab</Cta>
			<Cta ghost href="/games">Random historical game ⤳</Cta>
		</div>
	</div>

	<!-- COVERAGE TIMELINE -->
	<div class="relative border-t border-line px-12 pb-14 pt-10">
		<div class="mb-6 flex items-baseline justify-between">
			<Eyebrow>Coverage · {pageCount?.seasons ?? 108} seasons</Eyebrow>
			<div class="font-mono text-[10px] tracking-[1.2px] text-dim">EVENTS PER ERA · LOG SCALE</div>
		</div>
		<div class="grid grid-cols-8 gap-5">
			{#each eraBuckets as e, i (e.era)}
				{@const h = Math.max(8, (Math.log10(Math.max(1, e.events)) / maxLog) * 110)}
				{@const isCurrent = i === eraBuckets.length - 1}
				<div>
					<div class="mb-3.5 flex h-[120px] items-end">
						<div
							class="w-full rounded-t-[2px]"
							style:height="{h}px"
							style:background={isCurrent ? '#ec3a3a' : '#6dc9ff'}
							style:opacity={isCurrent ? 1 : 0.4}
						></div>
					</div>
					<div class="mb-2.5 h-px bg-lineHard"></div>
					<div class="font-mono text-[11px] tracking-[0.5px] text-ink">{e.era}</div>
					<div class="mt-[3px] font-mono text-[10px] text-dim">{(e.events / 1000).toFixed(0)}k events</div>
					<div class="mt-1 font-body text-[11px] text-dim2">{e.games.toLocaleString()} games</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- DATA SCALE STRIP -->
<div class="grid grid-cols-6 border-b border-line px-12 py-10">
	{#if pageCount}
		<StatNum value={pageCount.seasons} label="seasons of play" size={44} />
		<StatNum value={pageCount.games} label="games archived" size={44} />
		<StatNum value={pageCount.players} label="players indexed" size={44} />
		<StatNum value={pageCount.shotCoords} label="shots with coords" size={44} />
		<StatNum value={pageCount.hhof} label="hall of famers" size={44} />
		<StatNum value={pageCount.active} label="active today" size={44} />
	{/if}
</div>

<!-- SHOT DENSITY SIGNATURE -->
<div class="grid items-center gap-16 border-b border-line px-12 py-16" style="grid-template-columns: 1fr 380px;">
	<div class="relative">
		<Rink width={820} />
		<svg width="820" height={820 * 85 / 200} viewBox="0 0 200 85" class="absolute inset-0">
			{#each blobs as b}
				<circle cx={b.x} cy={b.y} r={b.r} fill="#ec3a3a" opacity={b.o} style="mix-blend-mode:screen" />
			{/each}
		</svg>
	</div>
	<div>
		<Eyebrow>Shot density · all-time</Eyebrow>
		<div class="mt-4 font-display font-medium text-ink" style="font-size:64px; line-height:1; letter-spacing:-1px">
			Where the league shoots from.
		</div>
		<div class="mt-[18px] text-[15px] leading-[1.6] text-dim2">
			Every shot on goal from the modern era, plotted by puck location. The slot — the patch of ice between the faceoff dots, within 20 feet of
			the net — accounts for over half of all goals scored.
		</div>
		<div class="mt-8 grid grid-cols-2 gap-6">
			<div>
				<div class="font-display text-[44px] text-red">92%</div>
				<div class="mt-1 font-mono text-[10px] uppercase tracking-[1.2px] text-dim">FROM THE OFFENSIVE ZONE</div>
			</div>
			<div>
				<div class="font-display text-[44px] text-ink">1.4%</div>
				<div class="mt-1 font-mono text-[10px] uppercase tracking-[1.2px] text-dim">LONG-BOMBS ◀ DEF. ZONE</div>
			</div>
		</div>
		<div class="mt-9"><Cta href="/rink-lab">Open the Rink Lab →</Cta></div>
	</div>
</div>

<!-- MAIN GRID — Tonight / On this day / Leaders -->
<div class="grid" style="grid-template-columns: 1.4fr 1fr 1fr;">
	<!-- Tonight -->
	<div class="border-b border-r border-line">
		<div class="px-8 pb-2 pt-8">
			{#if tonightFallback && tonightFallbackDate}
				<Eyebrow>Last gameday · {new Date(tonightFallbackDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {tonight.length} games</Eyebrow>
				<div class="mt-3.5 font-display text-[36px] font-medium tracking-[-0.5px] text-ink">Around the league</div>
				<div class="mt-1.5 font-mono text-[10px] tracking-[1.2px] text-dim">NO GAMES SCHEDULED TODAY · SHOWING THE MOST-RECENT GAMEDAY</div>
			{:else}
				<Eyebrow>Tonight · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {tonight.length} games</Eyebrow>
				<div class="mt-3.5 font-display text-[36px] font-medium tracking-[-0.5px] text-ink">Around the league</div>
			{/if}
		</div>
		<div>
			{#each tonight.slice(0, 5) as g}
				{@const isLive = g.state === 'LIVE'}
				<a href={`/game/${g.id}`} class="grid items-center gap-5 border-t border-line px-8 py-5 hover:bg-panel" style="grid-template-columns: 1fr auto;">
					<div>
						<div class="flex items-baseline gap-3.5">
							<div class="flex items-baseline gap-2.5">
								<span class="font-display text-[30px] tracking-[-0.5px] text-dim2">{g.away}</span>
								<span class="tnum font-display text-[30px] text-ink">{g.away_score ?? '—'}</span>
							</div>
							<span class="font-mono text-[11px] text-faint">@</span>
							<div class="flex items-baseline gap-2.5">
								<span class="font-display text-[30px] font-medium tracking-[-0.5px] text-ink">{g.home}</span>
								<span class="tnum font-display text-[30px] text-ink">{g.home_score ?? '—'}</span>
							</div>
						</div>
						<div class="mt-2 text-[12px] text-dim2">
							{g.venue ?? ''}
						</div>
					</div>
					<div>
						{#if isLive}
							<Tag color="#ec3a3a">
								<span class="h-[6px] w-[6px] rounded-full bg-red live-pulse"></span>
								LIVE
							</Tag>
						{:else}
							<Tag>{g.state ?? 'SCHEDULED'}</Tag>
						{/if}
					</div>
				</a>
			{:else}
				<div class="border-t border-line px-8 py-8 text-[13px] text-dim2">No games to show.</div>
			{/each}
		</div>
	</div>

	<!-- On this day -->
	<div class="border-b border-r border-line">
		<div class="px-7 pb-2 pt-8">
			<Eyebrow>On this day · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Eyebrow>
			<div class="mt-3.5 font-display text-[36px] font-medium tracking-[-0.5px] text-ink">Across {pageCount?.seasons ?? 108} {new Date().toLocaleDateString('en-US', { month: 'long' })}s</div>
		</div>
		<div class="px-7 pb-7 pt-5">
			{#each onThisDay as e, i}
				<div
					class="grid gap-3.5 py-3.5"
					class:border-t={i > 0}
					style="grid-template-columns: 64px 1fr;"
					style:border-color="#13192340"
				>
					<div class="tnum font-display text-[30px] leading-none text-red">{e.y}</div>
					<div class="text-[13px] leading-[1.5] text-ink2">{e.t}</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Leaders -->
	<div class="border-b border-line">
		<div class="px-7 pb-2 pt-8">
			<Eyebrow>Live · {currentSeasonLabel}</Eyebrow>
			<div class="mt-3.5 font-display text-[36px] font-medium tracking-[-0.5px] text-ink">Goals leaders</div>
		</div>
		<div>
			{#each leaders.slice(0, 7) as p, i (p.id)}
				<div class="grid items-center gap-3 px-7 py-3" style="grid-template-columns: 24px 1fr auto; border-top: 1px solid #13192340;">
					<span class="font-mono text-[11px] text-dim">{i + 1}</span>
					<a href={`/player/${p.id}`} class="text-[13px] text-ink hover:underline">{p.first_name?.[0]}. {p.last_name}</a>
					<span class="tnum font-display text-[26px] tracking-[-0.5px] text-ink">{p.goals}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- LEDGER — career records -->
<div class="border-b border-line px-12 py-16">
	<div class="mb-9 flex items-end justify-between">
		<div>
			<Eyebrow>The ledger · live-computed from {pageCount?.events ?? '7.1M'} events</Eyebrow>
			<div class="mt-4 font-display text-[56px] font-medium leading-none tracking-[-1px] text-ink">Career records, queried live.</div>
		</div>
		<Cta href="/records">See all records →</Cta>
	</div>

	<div class="grid grid-cols-4 gap-5">
		{#each ledger as r}
			<div class="relative rounded-lg border border-line bg-panel p-6">
				<div class="flex items-center justify-between">
					<Eyebrow accent={false}>{r.metric}</Eyebrow>
					{#if r.active}
						<span class="h-[6px] w-[6px] rounded-full bg-red" style="box-shadow:0 0 8px #ec3a3a"></span>
					{/if}
				</div>
				<div
					class="tnum mt-5 font-display font-medium text-ink"
					style="font-size:72px; line-height:1; letter-spacing:-1.5px"
				>
					{fmt(r.value)}
				</div>
				<div class="mt-4 border-t border-line pt-4">
					<a href={`/player/${r.id}`} class="text-[14px] text-ink hover:underline">{r.first_name} {r.last_name}</a>
					<div class="mt-1 font-mono text-[10px] uppercase tracking-[1px] text-dim">
						{r.active ? 'ACTIVE' : 'RETIRED'}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- THREE WAYS IN -->
<div class="border-b border-line px-12 py-16">
	<Eyebrow>How to use the data</Eyebrow>
	<div class="mb-11 mt-4 font-display text-[56px] font-medium leading-none tracking-[-1px] text-ink">Three ways in.</div>

	<div class="grid grid-cols-3 gap-6">
		{#each [
			{ n: '01', t: 'Compare two skaters.', body: 'Drop in any two players. Filter by era, situation, opponent, zone. Side-by-side stat table and overlaid shot maps.', stat: '13 stat categories · 6 filter dimensions', cta: 'Open compare →', href: '/comparison' },
			{ n: '02', t: 'Match skater vs goalie.', body: 'Pick a shooter. Pick a goalie. See every shot the shooter ever took at that goalie, where it came from, what worked.', stat: '1.16M shots indexed by puck location', cta: 'Open versus →', href: '/versus' },
			{ n: '03', t: 'Click any inch of ice.', body: 'In the Rink Lab, every 4×4 ft square is queryable. See every shooter who lived there, every era, every conversion rate.', stat: '108 seasons of coordinate data', cta: 'Open rink lab →', href: '/rink-lab' }
		] as f}
			<div class="flex flex-col rounded-lg border border-line bg-panel p-8">
				<div class="font-mono text-[11px] tracking-[1.6px] text-red">{f.n}</div>
				<div class="mt-5 font-display text-[32px] font-medium leading-[1.1] tracking-[-0.5px] text-ink">{f.t}</div>
				<div class="mt-3.5 flex-1 text-[14px] leading-[1.6] text-dim2">{f.body}</div>
				<div class="mt-6 border-t border-line pt-5 font-mono text-[10px] uppercase tracking-[1.2px] text-dim">{f.stat}</div>
				<div class="mt-4"><Cta small href={f.href}>{f.cta}</Cta></div>
			</div>
		{/each}
	</div>
</div>

<StatusBar />
