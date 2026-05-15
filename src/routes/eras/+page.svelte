<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import Eyebrow from '$lib/components/Eyebrow.svelte';
	import Rink from '$lib/components/Rink.svelte';
	import Pill from '$lib/components/Pill.svelte';

	export let data: { eras: any };
	$: e = data.eras;
	$: curve = e.curve as Array<{ season: number; year: number; games: number; gpg: number }>;
	$: eraCards = e.era_cards as Array<any>;
	$: drift = e.drift as Array<{ year: number; bins: { x: number; y: number; n: number }[] }>;
	$: peaks = e.peaks as Array<any>;
	$: peak = e.peak;
	$: trough = e.trough;

	const fmt = (n: number) => n.toLocaleString('en-US');

	// chart geometry
	const W = 1344;
	const H = 280;
	$: yMax = Math.max(...curve.map((r) => r.gpg), 8);
	$: yMin = Math.max(2, Math.min(...curve.map((r) => r.gpg).filter((v) => v > 0)) - 1);
	$: step = curve.length > 1 ? W / (curve.length - 1) : W / 2;
	$: pts = curve.map((r, i) => ({ x: i * step, y: H - ((r.gpg - yMin) / (yMax - yMin)) * H, r }));
	$: path = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
	$: area = pts.length ? `${path} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z` : '';
	$: xFor = (year: number) => {
		const first = curve[0]?.year ?? 1917;
		const last = curve[curve.length - 1]?.year ?? 2026;
		return ((year - first) / (last - first)) * W;
	};
	$: peakPt = peak ? { x: xFor(peak.year), y: H - ((peak.gpg - yMin) / (yMax - yMin)) * H } : null;
	$: troughPt = trough ? { x: xFor(trough.year), y: H - ((trough.gpg - yMin) / (yMax - yMin)) * H } : null;

	const bands = [
		{ start: 1917, end: 1942, label: 'Pre-modern', color: '#4a5160' },
		{ start: 1942, end: 1967, label: 'Original Six', color: '#7c8595' },
		{ start: 1967, end: 1979, label: 'Expansion', color: '#4a5160' },
		{ start: 1979, end: 1993, label: 'Run-and-Gun', color: '#ec3a3a' },
		{ start: 1993, end: 2004, label: 'Dead-puck', color: '#6dc9ff' },
		{ start: 2004, end: 2012, label: 'Post-lockout', color: '#7c8595' },
		{ start: 2012, end: 2018, label: 'Analytics', color: '#4a5160' },
		{ start: 2018, end: 2026, label: 'Slot shot', color: '#ec3a3a' }
	];

	function maxN(arr: { n: number }[]) {
		return arr.reduce((m, b) => (b.n > m ? b.n : m), 1);
	}

	$: peakMax = Math.max(...peaks.map((p: any) => p.points), 1);
</script>

<svelte:head><title>Eras · ANHLS</title></svelte:head>

<TopNav active="era" />

<!-- Hero -->
<div class="border-b border-line px-12 pb-12 pt-16">
	<Eyebrow>{curve.length} seasons of hockey</Eyebrow>
	<div class="mt-6 max-w-[1100px] font-display text-[96px] font-medium leading-[0.92] tracking-[-2px] text-ink">
		The dead-puck era ended.<span class="text-dim"> The slot-shot era is just beginning.</span>
	</div>
	<div class="mt-6 max-w-[720px] text-[16px] leading-[1.6] text-dim2">
		Goals per game by season, from the inaugural 1917–18 schedule through tonight. The shape of hockey has changed.
	</div>
</div>

<!-- Big timeline -->
<div class="border-b border-line px-12 pb-14 pt-12">
	<div class="mb-6 flex items-end justify-between">
		<div>
			<Eyebrow>Goals per game · league average</Eyebrow>
			<div class="mt-3 font-display text-[36px] tracking-[-0.5px] text-ink">
				{#if peak && trough}From {peak.gpg} to {trough.gpg} and back.{/if}
			</div>
		</div>
		<div class="flex gap-2">
			<Pill active>Goals/GP</Pill>
			<button type="button" class="cursor-not-allowed opacity-40" disabled title="Coming soon"><Pill>Shots/GP</Pill></button>
			<button type="button" class="cursor-not-allowed opacity-40" disabled title="Coming soon"><Pill>Save %</Pill></button>
			<button type="button" class="cursor-not-allowed opacity-40" disabled title="Coming soon"><Pill>Power-play %</Pill></button>
		</div>
	</div>

	<svg width={W} height={H + 60} class="block max-w-full">
		<defs>
			<linearGradient id="goalsFill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#ec3a3a" stop-opacity="0.25" />
				<stop offset="100%" stop-color="#ec3a3a" stop-opacity="0" />
			</linearGradient>
		</defs>

		{#each [Math.round(yMin + 1), Math.round((yMin + yMax) / 2), Math.round(yMax - 1)] as v}
			<line x1="0" y1={H - ((v - yMin) / (yMax - yMin)) * H} x2={W} y2={H - ((v - yMin) / (yMax - yMin)) * H} stroke="#1a2030" stroke-width="0.6" />
			<text x="0" y={H - ((v - yMin) / (yMax - yMin)) * H - 4} font-family="JetBrains Mono, monospace" font-size="10" fill="#7c8595">{v.toFixed(1)}</text>
		{/each}

		{#each bands as b}
			{@const x1 = xFor(b.start)}
			{@const x2 = xFor(b.end)}
			<rect x={x1} y={H + 18} width={Math.max(2, x2 - x1 - 1)} height="4" fill={b.color} opacity="0.6" />
			<text x={(x1 + x2) / 2} y={H + 38} font-family="JetBrains Mono, monospace" font-size="9" fill="#a4abb8" text-anchor="middle" letter-spacing="1">
				{b.label.toUpperCase()}
			</text>
		{/each}

		{#if area}<path d={area} fill="url(#goalsFill)" />{/if}
		{#if path}<path d={path} fill="none" stroke="#f4f5f7" stroke-width="1.8" />{/if}

		{#if peakPt}
			<circle cx={peakPt.x} cy={peakPt.y} r="5" fill="#ec3a3a" stroke="#0b0e14" stroke-width="2" />
			<text x={peakPt.x} y={peakPt.y - 14} text-anchor="middle" font-family="Antonio, sans-serif" font-size="14" fill="#ec3a3a">peak {peak.gpg}</text>
		{/if}
		{#if troughPt}
			<circle cx={troughPt.x} cy={troughPt.y} r="5" fill="#6dc9ff" stroke="#0b0e14" stroke-width="2" />
			<text x={troughPt.x} y={troughPt.y + 22} text-anchor="middle" font-family="Antonio, sans-serif" font-size="14" fill="#6dc9ff">trough {trough.gpg}</text>
		{/if}

		{#each [1920, 1940, 1960, 1980, 2000, 2020] as y}
			<text x={xFor(y)} y={H + 12} font-family="JetBrains Mono, monospace" font-size="10" fill="#7c8595" text-anchor="middle">{y}</text>
		{/each}
	</svg>
</div>

<!-- Era cards -->
<div class="border-b border-line px-12 pb-14 pt-14">
	<Eyebrow>Eight eras of hockey</Eyebrow>
	<div class="mb-10 mt-4 font-display text-[48px] font-medium tracking-[-1px] text-ink">Each one looks different on the rink.</div>

	<div class="grid grid-cols-4 gap-5">
		{#each eraCards as c}
			{@const isActive = c.year_end >= 2024}
			{@const cool = c.accent === 'ice'}
			<div
				class="relative rounded-lg border border-line p-6"
				style:background={isActive ? 'rgba(236,58,58,0.06)' : '#11151d'}
			>
				{#if isActive}
					<span class="absolute right-4 top-4 h-[6px] w-[6px] rounded-full bg-red" style="box-shadow: 0 0 8px #ec3a3a"></span>
				{/if}
				<Eyebrow accent={cool ? '#6dc9ff' : '#ec3a3a'}>{c.year_start}–{c.year_end}</Eyebrow>
				<div class="mt-3.5 font-display text-[28px] font-medium leading-[1.05] tracking-[-0.5px] text-ink">{c.label}</div>
				<div class="tnum mt-5 font-display text-[56px] font-medium leading-none tracking-[-1px]" style:color={cool ? '#6dc9ff' : '#ec3a3a'}>
					{c.gpg}
				</div>
				<div class="mt-1 font-mono text-[10px] tracking-[1.2px] text-dim">GOALS / GAME</div>
				<div class="mt-4 border-t border-line pt-4 text-[13px] text-ink">{fmt(c.games)} games played</div>
				<div class="mt-1 font-mono text-[10px] tracking-[1.2px] text-dim">REGULAR SEASON</div>
				{#if c.hero}
					<div class="mt-4 border-t border-line pt-4 font-display text-[18px] leading-[1.1] text-ink">{c.hero}</div>
					{#if c.hero_goals != null}
						<div class="mt-1 font-mono text-[10px] tracking-[1.2px] text-dim">{fmt(c.hero_goals)} GOALS · ERA LEADER</div>
					{/if}
				{/if}
				{#if c.description}
					<div class="mt-3 font-body text-[12px] leading-[1.5] text-dim2">{c.description}</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<!-- Spatial drift -->
<div class="border-b border-line px-12 py-14">
	<div class="mb-9 flex items-end justify-between">
		<div>
			<Eyebrow>Spatial drift · {drift[0]?.year ?? '—'} → {drift[drift.length - 1]?.year ?? '—'}</Eyebrow>
			<div class="mt-4 max-w-[900px] font-display text-[44px] font-medium leading-[1.05] tracking-[-1px] text-ink">
				The rink is shrinking around the net.
			</div>
			<div class="mt-3 max-w-[720px] text-[14px] leading-[1.6] text-dim2">
				Three snapshot seasons. Each shot location is binned into 4×4 ft cells, colored by density.
			</div>
		</div>
	</div>

	<div class="grid grid-cols-3 gap-6">
		{#each drift as d}
			{@const m = maxN(d.bins)}
			<div>
				<Eyebrow>{d.year}</Eyebrow>
				<div class="mb-4 mt-2 font-body text-[13px] text-dim2">
					{d.bins.length} bins · {fmt(d.bins.reduce((s, b) => s + b.n, 0))} shots
				</div>
				<div class="relative">
					<Rink width={420} />
					<svg width="420" height={420 * 85 / 200} viewBox="0 0 200 85" class="absolute inset-0">
						{#each d.bins as b}
							{@const mx = b.x < 0 ? -b.x : b.x}
							{@const my = b.x < 0 ? -b.y : b.y}
							<rect x={100 + mx - 1} y={42.5 + my - 1} width="2" height="2" fill="#ec3a3a" opacity={(b.n / m) * 0.8} />
						{/each}
					</svg>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Peak seasons -->
<div class="border-b border-line px-12 py-14">
	<div class="mb-8 flex items-end justify-between">
		<div>
			<Eyebrow>Peak seasons across decades</Eyebrow>
			<div class="mt-3 font-display text-[40px] tracking-[-0.5px] text-ink">How does an MVP season compare?</div>
		</div>
	</div>
	<div class="grid grid-cols-5 overflow-hidden rounded-lg border border-line">
		{#each peaks as p, i}
			<a href={`/player/${p.id}`} class="bg-panel p-6 hover:bg-panel2 {i < peaks.length - 1 ? 'border-r border-line' : ''}">
				<Eyebrow>{p.decade}s</Eyebrow>
				<div class="mt-4 font-body text-[14px] text-ink">{p.first_name} {p.last_name}</div>
				<div class="mt-1 font-mono text-[10px] tracking-[1px] text-dim">{p.season}</div>
				<div class="tnum mt-5 font-display text-[56px] font-medium leading-none tracking-[-1px] text-red">{p.points}</div>
				<div class="mt-1 font-mono text-[10px] tracking-[1px] text-dim">{p.goals}G · {p.assists}A</div>
				<div class="relative mt-4 h-1 rounded-[2px]" style="background:#13192340">
					<div class="absolute bottom-0 left-0 top-0 rounded-[2px] bg-red opacity-70" style:width="{(p.points / peakMax) * 100}%"></div>
				</div>
			</a>
		{/each}
	</div>
</div>

<StatusBar note={`ERAS · ${curve.length} seasons · indexed on (season, game_type)`} />
