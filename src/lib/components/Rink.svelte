<script lang="ts">
	export let width = 600;
	export let stroke = '#222a3a';
	export let accent = '#ec3a3a';
	export let ice = '#0b0e14';
	export let showCoords = false;
	export let id = 'rinkGrid';
	$: h = width * (85 / 200);
	$: gridId = `${id}-${Math.random().toString(36).slice(2, 7)}`;
</script>

<svg {width} height={h} viewBox="0 0 200 85" class="block">
	<defs>
		<pattern id={gridId} width="10" height="10" patternUnits="userSpaceOnUse">
			<path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1a2030" stroke-width="0.15" opacity="0.5" />
		</pattern>
	</defs>
	<rect x="0" y="0" width="200" height="85" rx="14" ry="14" fill={ice} />
	<rect x="0" y="0" width="200" height="85" rx="14" ry="14" fill="url(#{gridId})" />
	<rect x="0.5" y="0.5" width="199" height="84" rx="13.5" ry="13.5" fill="none" {stroke} stroke-width="0.6" />
	<line x1="100" y1="0" x2="100" y2="85" stroke={accent} stroke-width="0.7" />
	<line x1="75" y1="0" x2="75" y2="85" stroke="#6dc9ff" stroke-width="0.5" opacity="0.7" />
	<line x1="125" y1="0" x2="125" y2="85" stroke="#6dc9ff" stroke-width="0.5" opacity="0.7" />
	<line x1="11" y1="0" x2="11" y2="85" stroke={accent} stroke-width="0.35" opacity="0.7" />
	<line x1="189" y1="0" x2="189" y2="85" stroke={accent} stroke-width="0.35" opacity="0.7" />
	<circle cx="100" cy="42.5" r="9" fill="none" stroke="#6dc9ff" stroke-width="0.3" opacity="0.7" />
	<circle cx="100" cy="42.5" r="0.6" fill="#6dc9ff" />
	{#each [[31, 22], [31, 63], [169, 22], [169, 63]] as [cx, cy]}
		<g>
			<circle {cx} {cy} r="7.5" fill="none" stroke={accent} stroke-width="0.3" opacity="0.7" />
			<circle {cx} {cy} r="0.5" fill={accent} />
		</g>
	{/each}
	{#each [[80, 22], [80, 63], [120, 22], [120, 63]] as [cx, cy]}
		<circle {cx} {cy} r="0.5" fill={accent} opacity="0.7" />
	{/each}
	<path d="M 11 38 Q 17 42.5 11 47" fill="none" stroke="#6dc9ff" stroke-width="0.3" opacity="0.7" />
	<path d="M 189 38 Q 183 42.5 189 47" fill="none" stroke="#6dc9ff" stroke-width="0.3" opacity="0.7" />
	<rect x="9" y="40.5" width="2" height="4" fill="none" stroke={accent} stroke-width="0.3" opacity="0.7" />
	<rect x="189" y="40.5" width="2" height="4" fill="none" stroke={accent} stroke-width="0.3" opacity="0.7" />
	{#if showCoords}
		<g font-family="JetBrains Mono, monospace" font-size="2" fill="#7c8595" opacity="0.6">
			<text x="2" y="4">−100,−42</text>
			<text x="178" y="4">+100,−42</text>
			<text x="2" y="83">−100,+42</text>
			<text x="172" y="83">+100,+42</text>
			<text x="98" y="4">0,0</text>
		</g>
	{/if}
	<slot />
</svg>
