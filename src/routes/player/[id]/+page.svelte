<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import Eyebrow from '$lib/components/Eyebrow.svelte';
	import Rink from '$lib/components/Rink.svelte';
	import StatNum from '$lib/components/StatNum.svelte';
	import KPI from '$lib/components/KPI.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import Pill from '$lib/components/Pill.svelte';

	export let data: { player: any };
	$: p = data.player;
	$: brief = p.player;
	$: isGoalie = p.is_goalie === true;
	$: kpis = p.kpis;
	$: arc = p.career_arc as Array<{ season: number; season_label: string; year: number; gp: number; g: number; a: number; pts: number; shots: number; sh_pct: number; saves?: number; goals_against?: number; sv_pct?: number }>;
	$: peak = p.peak_season;
	$: currentArc = arc.length ? arc[arc.length - 1] : null;

	const POS_LABEL: Record<string, string> = { C: 'C', L: 'LW', R: 'RW', D: 'D', G: 'G' };
	const fmt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('en-US'));

	$: shots = (p.shot_map ?? []) as Array<{ coord_x: number; coord_y: number; type_desc: string; shot_type?: string }>;
	// Normalize shots to right side of rink (mirror negative x), so the heat collapses to one half
	$: mirroredShots = shots.map((s) => ({
		x: s.coord_x < 0 ? -s.coord_x : s.coord_x,
		y: s.coord_x < 0 ? -s.coord_y : s.coord_y,
		goal: s.type_desc === 'goal',
		type: s.shot_type
	}));
	// Project coords into rink space. NHL coords: x ∈ [-100,100], y ∈ [-42.5, 42.5].
	// Rink viewBox is 200x85, centered on 100,42.5. We want shots on the right half (offensive) → translate x by +100, y by +42.5.
	function rinkX(x: number) { return 100 + x; }
	function rinkY(y: number) { return 42.5 + y; }

	// Shot type breakdown for the 4-card row
	$: shotTypeAgg = (() => {
		const map = new Map<string, { sog: number; goals: number }>();
		for (const s of shots) {
			const t = (s.shot_type || 'other').toLowerCase();
			const entry = map.get(t) ?? { sog: 0, goals: 0 };
			entry.sog += 1;
			if (s.type_desc === 'goal') entry.goals += 1;
			map.set(t, entry);
		}
		return Array.from(map.entries())
			.sort((a, b) => b[1].sog - a[1].sog)
			.slice(0, 4);
	})();
	$: shotTypeMax = shotTypeAgg.length ? shotTypeAgg[0][1].sog : 1;

	// Career arc chart
	const ARC_W = 1344;
	const ARC_H = 220;
	$: arcMaxG = Math.max(...arc.map((r) => r.g), 30);
	$: arcPoints = arc.map((r, i) => {
		const x = arc.length > 1 ? (i / (arc.length - 1)) * ARC_W : ARC_W / 2;
		const y = ARC_H - (r.g / arcMaxG) * ARC_H;
		return { x, y, r };
	});
	$: arcPath = arcPoints.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');
	$: arcArea = arcPoints.length
		? `${arcPath} L ${arcPoints[arcPoints.length - 1].x} ${ARC_H} L ${arcPoints[0].x} ${ARC_H} Z`
		: '';
	$: arcGridlines = [Math.round(arcMaxG * 0.33), Math.round(arcMaxG * 0.66), Math.round(arcMaxG * 0.95)];

	// Period heat for the bottom-right card
	$: heat = (p.period_heat ?? new Array(60).fill(0)) as number[];
	$: heatMax = Math.max(...heat, 1);
	$: periodTotals = [
		heat.slice(0, 20).reduce((a, b) => a + b, 0),
		heat.slice(20, 40).reduce((a, b) => a + b, 0),
		heat.slice(40, 60).reduce((a, b) => a + b, 0)
	];
	$: bestPeriod = periodTotals.indexOf(Math.max(...periodTotals)) + 1;
	$: bestMinute = heat.indexOf(Math.max(...heat));

	// Most-faced goalies
	$: facedGoalies = (p.faced_goalies ?? []) as Array<{ id: number; first_name: string; last_name: string; shots: number; goals: number }>;
	$: avgGoals = (p.avg_goals ?? 0) as number;

	const filter = 'Career';
</script>

<svelte:head>
	<title>{brief.first_name} {brief.last_name} · ANHLS</title>
</svelte:head>

<TopNav active="players" />

<!-- breadcrumb -->
<div class="flex items-center gap-2.5 border-b border-line px-12 py-3 font-mono text-[10px] tracking-[1.2px] text-dim">
	<a href="/players" class="hover:text-ink">PLAYERS</a>
	<span class="text-faint">/</span>
	<span>{(brief.position === 'G' ? 'GOALIES' : 'SKATERS')}</span>
	<span class="text-faint">/</span>
	<span class="text-ink2">{brief.last_name?.toUpperCase()}, {brief.first_name?.toUpperCase()}</span>
	<span class="ml-2 text-faint">id {brief.id} · /player/{brief.id}</span>
</div>

<!-- HERO -->
<div class="grid border-b border-line" style="grid-template-columns: 320px 1fr;">
	<!-- headshot -->
	<div
		class="relative border-r border-line"
		style="aspect-ratio: 4/5; background-image: linear-gradient(135deg, #161b25 0%, #070910 100%), repeating-linear-gradient(45deg, transparent 0 8px, #13192340 8px 9px);"
	>
		{#if brief.headshot_url}
			<img src={brief.headshot_url} alt={brief.full_name} class="absolute inset-0 h-full w-full object-cover opacity-90" />
		{/if}
		<div class="absolute inset-x-0 bottom-0 flex items-end justify-between p-5" style="background: linear-gradient(180deg, transparent, #070910);">
			<div class="font-display font-semibold text-red" style="font-size:140px; line-height:0.85; letter-spacing:-4px;">
				{brief.sweater_number ?? '—'}
			</div>
			<div class="text-right">
				<div class="font-mono text-[10px] tracking-[1.4px] text-dim">{brief.team_abbrev ?? '—'}</div>
				<div class="font-mono text-[10px] tracking-[1.4px] text-dim">
					{POS_LABEL[brief.position] ?? brief.position} · {p.bio?.shoots_catches ?? '—'} · {p.bio?.height_cm ? Math.floor(p.bio.height_cm / 2.54 / 12) + "'" + Math.round((p.bio.height_cm / 2.54) % 12) + '"' : '—'}
				</div>
			</div>
		</div>
	</div>

	<!-- identity + KPIs -->
	<div class="flex flex-col gap-8 px-12 py-10">
		<div>
			<div class="mb-4 flex gap-2">
				{#if brief.is_active}
					<Tag color="#ec3a3a" bg="rgba(236,58,58,0.15)">● ACTIVE</Tag>
				{:else}
					<Tag>RETIRED</Tag>
				{/if}
				{#if arc.length}
					<Tag>{arc[0].year} → {arc.length === 1 ? arc[0].year : arc[arc.length - 1].year} · {arc.length} seasons</Tag>
				{/if}
				{#if brief.in_top_100}
					<Tag color="#f3c969">★ Top-100 all-time</Tag>
				{/if}
				{#if brief.in_hhof}
					<Tag color="#f3c969">★ Hall of Fame</Tag>
				{/if}
			</div>
			<div class="mb-[2px] font-body text-[16px] text-dim2">{brief.first_name}</div>
			<div class="font-display font-medium text-ink" style="font-size:128px; line-height:0.9; letter-spacing:-4px;">
				{brief.last_name?.toUpperCase()}
			</div>
		</div>

		<div class="grid grid-cols-4 gap-7">
			{#if isGoalie}
				<StatNum value={fmt(kpis.saves)} label="Career saves" sub={`${arc.length} seasons`} accent="#6dc9ff" size={56} />
				<StatNum value={`${kpis.sv_pct}%`} label="Save percentage" sub={`${fmt(kpis.shots_against)} shots`} size={56} />
				<StatNum value={fmt(kpis.goals_against)} label="Goals against" sub="career" accent="#ec3a3a" size={56} />
				<StatNum value={fmt(kpis.shutouts)} label="Shutouts" sub={`${kpis.games_played} GP`} size={56} />
			{:else}
				<StatNum value={fmt(kpis.goals)} label="Career goals" sub={`${arc.length ? Math.round(kpis.goals / arc.length * 10) / 10 : 0}/season`} accent="#ec3a3a" size={56} />
				<StatNum value={fmt(kpis.points)} label="Career points" sub={`${kpis.assists.toLocaleString()} A`} size={56} />
				<StatNum value={fmt(kpis.shots)} label="Shots on goal" sub={kpis.shots ? `${(100 * kpis.goals / kpis.shots).toFixed(1)}% SH%` : 'pre-modern era'} size={56} />
				{#if kpis.shots && kpis.office_pct}
					<StatNum value={`${kpis.office_pct}%`} label='From "The Office"' sub="off-wing high-danger" accent="#6dc9ff" size={56} />
				{:else}
					<StatNum value={fmt(kpis.assists)} label="Career assists" sub={`${arc.length} seasons`} accent="#6dc9ff" size={56} />
				{/if}
			{/if}
		</div>

		<div class="flex gap-3 border-t border-line pt-6">
			<Pill active={filter === 'Career'}>Career</Pill>
			<Pill>By season</Pill>
			<Pill>Playoffs</Pill>
			<Pill>Power play</Pill>
			<Pill>5v5</Pill>
			<div class="flex-1"></div>
			<span class="self-center font-mono text-[10px] tracking-[1.2px] text-dim">↳ FILTER · {fmt(isGoalie ? (kpis.shots_against ?? 0) : (kpis.shots ?? 0))} {isGoalie ? 'SHOTS AGAINST' : 'SHOTS'}</span>
		</div>
	</div>
</div>

<!-- CAREER ARC -->
<div class="border-b border-line px-12 pb-14 pt-12">
	<div class="mb-7 flex items-end justify-between">
		<div>
			<Eyebrow>Career arc · {arc.length} seasons</Eyebrow>
			<div class="mt-3 font-display text-[40px] font-medium leading-[1.05] tracking-[-0.5px] text-ink">
				{#if isGoalie}
					Saves by season — peak at {fmt(peak?.saves ?? 0)} in {peak?.season_label ?? '—'}.
				{:else}
					Goals by season — peak at {peak?.g ?? '—'} in {peak?.season_label ?? '—'}.
				{/if}
			</div>
		</div>
		<div class="flex items-start gap-7">
			{#if isGoalie}
				<KPI value={fmt(peak?.saves ?? 0)} label={`Peak (${peak?.season_label ?? '—'})`} />
				<KPI value={`${(arc.reduce((a, r) => a + (r.sv_pct ?? 0), 0) / Math.max(1, arc.length)).toFixed(2)}%`} label="Avg SV%" />
				{#if currentArc}
					<KPI value={`${currentArc.sv_pct ?? 0}%`} label={`${currentArc.season_label}`} accent="#6dc9ff" />
				{/if}
			{:else}
				<KPI value={peak?.g ?? '—'} label={`Peak (${peak?.season_label ?? '—'})`} />
				<KPI value={avgGoals} label="Average / season" />
				{#if currentArc}
					<KPI value={currentArc.g} label={`${currentArc.season_label} (active)`} accent="#ec3a3a" />
				{/if}
			{/if}
		</div>
	</div>

	<svg width={ARC_W} height={ARC_H + 40} class="block max-w-full">
		<defs>
			<linearGradient id="arcFill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#ec3a3a" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#ec3a3a" stop-opacity="0" />
			</linearGradient>
		</defs>
		{#each arcGridlines as g}
			<line x1="0" y1={ARC_H - (g / arcMaxG) * ARC_H} x2={ARC_W} y2={ARC_H - (g / arcMaxG) * ARC_H} stroke="#1a2030" stroke-width="0.7" />
			<text x="0" y={ARC_H - (g / arcMaxG) * ARC_H - 4} font-family="JetBrains Mono, monospace" font-size="10" fill="#7c8595">{g}G</text>
		{/each}
		<line x1="0" y1={ARC_H - (50 / arcMaxG) * ARC_H} x2={ARC_W} y2={ARC_H - (50 / arcMaxG) * ARC_H} stroke="#ec3a3a" stroke-width="0.6" stroke-dasharray="4 4" opacity="0.4" />
		<text x={ARC_W - 60} y={ARC_H - (50 / arcMaxG) * ARC_H - 4} font-family="JetBrains Mono, monospace" font-size="10" fill="#ec3a3a">50G CLUB</text>
		{#if arcArea}<path d={arcArea} fill="url(#arcFill)" />{/if}
		{#if arcPath}<path d={arcPath} fill="none" stroke="#f4f5f7" stroke-width="1.8" />{/if}
		{#each arcPoints as pt, i}
			{@const isPeak = pt.r.g === (peak?.g ?? -1) && pt.r.season === (peak?.season ?? -1)}
			{@const isCurrent = i === arcPoints.length - 1}
			<circle cx={pt.x} cy={pt.y} r={isPeak || isCurrent ? 5 : 3} fill={isPeak ? '#f3c969' : isCurrent ? '#ec3a3a' : '#f4f5f7'} stroke="#0b0e14" stroke-width="2" />
			{#if isPeak || isCurrent}
				<text x={pt.x} y={pt.y - 12} text-anchor="middle" font-family="Antonio, sans-serif" font-size="18" font-weight="500" fill={isPeak ? '#f3c969' : '#ec3a3a'}>{pt.r.g}G</text>
			{/if}
		{/each}
		{#each arcPoints as pt, i}
			{#if i % 3 === 0}
				<text x={pt.x} y={ARC_H + 22} text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#7c8595">
					'{String(pt.r.year % 100).padStart(2, '0')}
				</text>
			{/if}
		{/each}
	</svg>
</div>

{#if isGoalie}
<!-- GOALIE SEASON LEDGER + FACED SHOOTERS -->
<div class="grid" style="grid-template-columns: 1fr 540px;">
	<div class="border-b border-r border-line px-12 py-10">
		<Eyebrow>Toughest opponents</Eyebrow>
		<div class="mt-3 font-display text-[36px] font-medium leading-[1.05] tracking-[-0.5px] text-ink">Who shot the most at him.</div>
		<div class="mt-2 max-w-[540px] text-[14px] leading-[1.6] text-dim2">
			Top shooters by total shots faced. {fmt(kpis.shots_against)} career shots against.
		</div>
		<div class="mt-8">
			{#each (p.faced_shooters ?? []) as s, i}
				<a
					href={`/versus?skater=${s.id}&goalie=${brief.id}`}
					class="grid items-center py-3.5 text-[13px] hover:bg-panel"
					style="grid-template-columns: 1fr 80px 60px 80px; border-bottom: 1px solid #13192340;"
				>
					<div>
						<div class="text-ink">{s.first_name} {s.last_name}</div>
						<div class="mt-[2px] font-mono text-[10px] text-dim">SHOOTER</div>
					</div>
					<div class="text-right font-mono text-dim2">{fmt(s.shots)} SOG</div>
					<div class="tnum text-right font-display text-[22px] text-red">{s.goals}</div>
					<div class="text-right font-mono text-[11px] text-dim">{s.shots ? ((1 - s.goals / s.shots) * 100).toFixed(1) : '—'}%</div>
				</a>
			{:else}
				<div class="py-6 font-mono text-[10px] text-dim">No shooter data on file.</div>
			{/each}
		</div>
	</div>
	<div class="border-b border-line">
		<div class="px-8 pb-6 pt-10">
			<Eyebrow>Season ledger</Eyebrow>
			<div class="mt-3 font-display text-[28px] font-medium tracking-[-0.5px] text-ink">Year-by-year (goalie)</div>
		</div>
		<div>
			<div
				class="grid border-b border-t border-line px-8 py-2.5 font-mono text-[9px] tracking-[1.4px] text-dim"
				style="grid-template-columns: 76px 32px 44px 44px 44px 56px 1fr;"
			>
				<span>SEASON</span><span>GP</span><span>SA</span><span>SV</span><span>GA</span><span>SV%</span><span>SPARK</span>
			</div>
			{#each arc as row, i}
				{@const isPeak = row.season === peak?.season}
				{@const isCurrent = i === arc.length - 1}
				{@const maxSv = Math.max(1, ...arc.map((r) => r.saves ?? 0))}
				<div
					class="grid items-center px-8 py-2.5 font-mono text-[11px] text-dim2"
					style="grid-template-columns: 76px 32px 44px 44px 44px 56px 1fr; border-bottom: 1px solid #13192340;"
					style:background={isPeak ? 'rgba(243,201,105,0.04)' : isCurrent ? 'rgba(236,58,58,0.06)' : 'transparent'}
				>
					<span style:color={isCurrent ? '#ec3a3a' : '#f4f5f7'}>{row.season_label}</span>
					<span>{row.gp}</span>
					<span>{fmt(row.shots ?? 0)}</span>
					<span style:color={isPeak ? '#f3c969' : '#f4f5f7'} style:font-weight={isPeak ? 600 : 400}>{fmt(row.saves ?? 0)}</span>
					<span class="text-red">{row.goals_against ?? 0}</span>
					<span>{row.sv_pct ?? 0}</span>
					<span class="flex items-center">
						<span
							class="h-[4px] rounded-[2px] opacity-75"
							style:width="{Math.min(100, ((row.saves ?? 0) / maxSv) * 80)}%"
							style:background={isPeak ? '#f3c969' : isCurrent ? '#ec3a3a' : '#6dc9ff'}
						></span>
					</span>
				</div>
			{/each}
		</div>
	</div>
</div>
<StatusBar note={`goalie ${brief.id} · ${fmt(kpis.saves)} saves · ${kpis.sv_pct}% SV · live from postgres`} />
{:else}
<!-- SHOT MAP + SEASON LEDGER -->
<div class="grid" style="grid-template-columns: 1fr 540px;">
	<div class="border-b border-r border-line px-12 py-10">
		<div class="mb-7 flex items-end justify-between">
			<div>
				<Eyebrow>Shot map · career</Eyebrow>
				<div class="mt-3 font-display text-[36px] font-medium leading-[1.05] tracking-[-0.5px] text-ink">
					{shots.length ? 'He shoots from his office.' : 'No coordinate data on file.'}
				</div>
				<div class="mt-2 max-w-[540px] text-[14px] leading-[1.6] text-dim2">
					{#if shots.length}
						{fmt(shots.length)} shots plotted by puck location. Goals shown in red.
					{:else}
						Shot location data was first recorded by the NHL in 2005-06. Earlier players have no coordinates in the play-by-play feed.
					{/if}
				</div>
			</div>
			<div class="flex gap-2">
				<Pill active>All</Pill>
				<Pill>Even</Pill>
				<Pill>Power play</Pill>
				<Pill>5v3</Pill>
			</div>
		</div>

		<div class="relative">
			<Rink width={840} />
			<svg width="840" height={840 * 85 / 200} viewBox="0 0 200 85" class="absolute inset-0">
				{#if shots.length}
					<ellipse cx="158" cy="29" rx="14" ry="9" fill="#ec3a3a" opacity="0.05" />
					<ellipse cx="158" cy="29" rx="14" ry="9" fill="none" stroke="#ec3a3a" stroke-width="0.3" stroke-dasharray="1 1" opacity="0.5" />
					<text x="148" y="50" font-family="JetBrains Mono, monospace" font-size="2.2" fill="#ec3a3a">THE OFFICE</text>
					{#each mirroredShots as s}
						<circle cx={rinkX(s.x)} cy={rinkY(s.y)} r={s.goal ? 0.7 : 0.45} fill={s.goal ? '#ec3a3a' : '#6dc9ff'} opacity={s.goal ? 0.8 : 0.18} />
					{/each}
				{:else}
					<text x="100" y="44" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3" fill="#7c8595">PRE-2005 · NO COORDINATES</text>
				{/if}
			</svg>
		</div>

		<div class="mt-8 grid grid-cols-4 gap-4">
			{#each shotTypeAgg as [type, agg]}
				<div class="rounded-md border border-line bg-panel px-[22px] py-5">
					<Eyebrow accent={false}>{type}</Eyebrow>
					<div class="mt-3 flex items-baseline gap-2.5">
						<span class="tnum font-display text-[30px] text-ink">{fmt(agg.sog)}</span>
						<span class="font-mono text-[11px] text-red">→ {agg.goals} G</span>
					</div>
					<div class="mt-3 h-[3px] rounded-[2px]" style="background:#13192340">
						<div class="h-full rounded-[2px] bg-red opacity-70" style:width="{(agg.sog / shotTypeMax) * 100}%"></div>
					</div>
				</div>
			{:else}
				<div class="col-span-4 rounded-md border border-dashed border-line bg-panel px-[22px] py-5 text-center font-mono text-[10px] tracking-[1.2px] text-dim">
					NO SHOT-TYPE BREAKDOWN · PRE-MODERN ERA
				</div>
			{/each}
		</div>
	</div>

	<!-- SEASON LEDGER -->
	<div class="border-b border-line">
		<div class="px-8 pb-6 pt-10">
			<Eyebrow>Season ledger</Eyebrow>
			<div class="mt-3 font-display text-[28px] font-medium tracking-[-0.5px] text-ink">Year-by-year</div>
		</div>
		<div>
			<div
				class="grid border-b border-t border-line px-8 py-2.5 font-mono text-[9px] tracking-[1.4px] text-dim"
				style="grid-template-columns: 76px 32px 36px 36px 40px 48px 1fr;"
			>
				<span>SEASON</span><span>GP</span><span>G</span><span>A</span><span>PTS</span><span>SH%</span><span>SPARK</span>
			</div>
			{#each arc as row, i}
				{@const isPeak = row.season === peak?.season}
				{@const isCurrent = i === arc.length - 1}
				<div
					class="grid items-center px-8 py-2.5 font-mono text-[11px] text-dim2"
					style="grid-template-columns: 76px 32px 36px 36px 40px 48px 1fr; border-bottom: 1px solid #13192340;"
					style:background={isPeak ? 'rgba(243,201,105,0.04)' : isCurrent ? 'rgba(236,58,58,0.06)' : 'transparent'}
				>
					<span style:color={isCurrent ? '#ec3a3a' : '#f4f5f7'}>{row.season_label}</span>
					<span>{row.gp}</span>
					<span style:color={isPeak ? '#f3c969' : '#f4f5f7'} style:font-weight={isPeak ? 600 : 400}>{row.g}</span>
					<span>{row.a}</span>
					<span>{row.pts}</span>
					<span>{row.sh_pct}</span>
					<span class="flex items-center">
						<span
							class="h-[4px] rounded-[2px] opacity-75"
							style:width="{Math.min(100, (row.g / Math.max(1, arcMaxG)) * 80)}%"
							style:background={isPeak ? '#f3c969' : isCurrent ? '#ec3a3a' : '#6dc9ff'}
						></span>
					</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- BOTTOM: opponents / milestones / period heat -->
<div class="grid grid-cols-3">
	<div class="border-b border-r border-line">
		<div class="px-8 pb-4 pt-8">
			<Eyebrow>Most-faced goalies</Eyebrow>
			<div class="mt-3 font-display text-[28px] font-medium tracking-[-0.5px] text-ink">His career arch-rivals</div>
		</div>
		<div>
			{#each facedGoalies as g}
				<a
					href={`/versus?skater=${brief.id}&goalie=${g.id}`}
					class="grid items-center px-8 py-3.5 text-[13px] hover:bg-panel"
					style="grid-template-columns: 1fr 56px 56px 60px; border-top: 1px solid #13192340;"
				>
					<div>
						<div class="text-ink">{g.first_name} {g.last_name}</div>
						<div class="mt-[2px] font-mono text-[10px] text-dim">GOALIE</div>
					</div>
					<div class="text-right font-mono text-dim2">{g.shots}</div>
					<div class="tnum text-right font-display text-[22px] text-red">{g.goals}</div>
					<div class="text-right font-mono text-[11px] text-dim">{g.shots ? ((1 - g.goals / g.shots) * 100).toFixed(1) : '—'}%</div>
				</a>
			{/each}
		</div>
	</div>

	<div class="border-b border-r border-line">
		<div class="px-8 pb-4 pt-8">
			<Eyebrow>Milestones</Eyebrow>
			<div class="mt-3 font-display text-[28px] font-medium tracking-[-0.5px] text-ink">From the event log</div>
		</div>
		<div>
			{#each [
				{ d: `${arc[0]?.year ?? '—'}`, t: 'NHL debut · first appearance in the play-by-play feed' },
				{ d: peak ? `${peak.season_label}` : '—', t: `Peak season — ${peak?.g ?? '—'} goals in ${peak?.season_label ?? '—'}` },
				{ d: `${arc[arc.length - 1]?.year ?? '—'}`, t: `Most recent season — ${currentArc?.g ?? 0}G / ${currentArc?.a ?? 0}A through ${currentArc?.gp ?? 0} games` },
				{ d: '—', t: `Career total: ${fmt(kpis.goals)}G · ${fmt(kpis.assists)}A · ${fmt(kpis.points)}P` }
			] as m}
				<div class="grid gap-4 px-8 py-3.5" style="grid-template-columns: 82px 1fr; border-top: 1px solid #13192340;">
					<div class="pt-[2px] font-mono text-[10px] tracking-[0.8px] text-red">{m.d}</div>
					<div class="text-[13px] leading-[1.5] text-ink2">{m.t}</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="border-b border-line">
		<div class="px-8 pb-4 pt-8">
			<Eyebrow>Period / time heat</Eyebrow>
			<div class="mt-3 font-display text-[28px] font-medium tracking-[-0.5px] text-ink">When he scores</div>
		</div>
		<div class="px-8 pb-8 pt-5">
			<svg width="380" height="78" class="block">
				{#each heat as v, i}
					{@const norm = v / heatMax}
					<rect
						x={i * (380 / 60)}
						y={78 - norm * 78 * 0.9}
						width={380 / 60 - 1.5}
						height={Math.max(1, norm * 78 * 0.9)}
						fill={norm > 0.85 ? '#ec3a3a' : '#6dc9ff'}
						opacity={0.25 + norm * 0.55}
						rx="1"
					/>
				{/each}
				<line x1={380 / 3} y1="0" x2={380 / 3} y2="78" stroke="#1a2030" stroke-width="0.5" />
				<line x1={(380 * 2) / 3} y1="0" x2={(380 * 2) / 3} y2="78" stroke="#1a2030" stroke-width="0.5" />
			</svg>
			<div class="mt-3.5 flex justify-between font-mono text-[9px] tracking-[0.8px] text-dim">
				<span>00:00</span><span>P1 END</span><span>P2 END</span><span>P3 END</span>
			</div>
			<div class="mt-7 grid grid-cols-2 gap-6">
				<KPI value={`${bestPeriod === 1 ? '1st' : bestPeriod === 2 ? '2nd' : '3rd'}`} sub={`${periodTotals[bestPeriod - 1]} goals`} label="Best period" />
				<KPI value={`${bestMinute % 20}–${(bestMinute % 20) + 1}`} sub={`P${Math.floor(bestMinute / 20) + 1} minute`} label="Hot zone" accent="#ec3a3a" />
			</div>
		</div>
	</div>
</div>

<StatusBar note={`player ${brief.id} · ${fmt(kpis.goals)}G · live from postgres`} />
{/if}
