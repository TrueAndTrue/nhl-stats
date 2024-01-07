<script>
	import { page } from '$app/stores';
	import nhlLogo from '$lib/images/nhl-shield.png';
	import github from '$lib/images/gh.png';
</script>

<header class="header">
	<div class="corner">
			<a href="https://nhl.com" class="logo-link">
					<img src={nhlLogo} alt="NHL Logo" class="logo" />
			</a>
	</div>

	<nav class="nav">
			<ul class="menu">
					<li class="{($page.url.pathname === '/') ? 'active' : ''}">
							<a href="/">Home</a>
					</li>
					<li class="{($page.url.pathname === '/comparison') ? 'active' : ''}">
							<a href="/comparison">Comparison Tool</a>
					</li>
					<li class="{($page.url.pathname === '/versus') ? 'active' : ''}">
							<a href="/versus">Versus Tool</a>
					</li>
			</ul>
	</nav>

	<div class="corner">
			<a href="https://github.com/TrueAndTrue/nhl-stats" class="logo-link">
					<img src={github} alt="GitHub" class="logo" />
			</a>
	</div>
</header>

<style>
	.header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 1rem;
			background-color: #1a1a1a; /* Preserving original color */
			color: #fff;
			font-family: 'Roboto', sans-serif;
	}

	.corner .logo-link {
			display: block;
			width: 3em;
			height: 3em;
			transition: transform 0.3s ease;
	}

	.corner .logo-link:hover .logo {
			transform: scale(1.1);
	}

	.nav .menu {
			list-style: none;
			display: flex;
			gap: 1rem;
	}

	.nav .menu li a {
			color: #f0f0f0;
			text-decoration: none;
			padding: 0.5rem 1rem;
			border-radius: 0.5rem;
			transition: background-color 0.3s ease;
	}

	.nav .menu li a:hover {
			background-color: rgba(255, 255, 255, 0.1); /* Subtle hover and active background */
	}

	.nav .menu li.active a {
			font-weight: 700;
			position: relative;
	}

	.nav .menu li.active a::after {
			content: '';
			position: absolute;
			bottom: -0.25rem;
			left: 0;
			right: 0;
			height: 3px;
			background-color: white; /* A bright color for the active indicator */
			border-radius: 1.5px;
	}

	@media (max-width: 600px) {
			.header {
					flex-direction: column;
			}

			.nav .menu {
					flex-direction: column;
					align-items: center;
					width: 100%;
			}

			.nav .menu li a {
					width: 100%;
					text-align: center;
			}
	}
</style>
