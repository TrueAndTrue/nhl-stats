<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Advanced NHL Stats</title>
		<link
			href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@700&display=swap"
			rel="stylesheet"
		/>
		<style>
			:root {
				--main-bg-color: #121212;
				--accent-color: #ffffff;
				--secondary-color: #c5c5c5;
				--header-font: 'Open Sans', sans-serif;
				--body-font: 'Roboto', sans-serif;
				--border-color: #333333;
				--box-shadow-color: rgba(255, 255, 255, 0.1);
				--text-glow: 0 0 8px rgba(255, 255, 255, 0.8);
				--hover-effect: 0 20px 30px rgba(0, 0, 0, 0.5);
			}

			* {
				box-sizing: border-box;
				margin: 0;
				padding: 0;
				transition: all 0.3s ease; /* Add transitions */
			}

			body {
				font-family: var(--body-font);
				background-color: var(--main-bg-color);
				color: var(--accent-color);
				line-height: 1.6;
				min-width: 100%;
			}

			.home-header {
				padding: 3rem;
				text-align: center;
				background: linear-gradient(to bottom, #232526, #414345);
				margin-bottom: 2rem;
				transition: background 0.3s ease;
			}

			.home-header:hover {
				background: linear-gradient(to bottom, #414345, #232526);
			}

			h1 {
				font-family: var(--header-font);
				font-size: 4rem;
				color: var(--accent-color);
				transition: text-shadow 0.3s ease;
			}

			h1:hover {
				text-shadow:
					0 0 1px var(--accent-color),
					0 0 2px var(--accent-color),
					0 0 2px var(--accent-color),
					0 0 7px var(--accent-color);
			}

			.sub-header {
				font-size: 1.5rem;
				color: var(--accent-color);
				margin-top: 1rem;
				text-shadow: var(--text-glow);
				transition: color 0.3s ease;
			}

			.sub-header:hover {
				color: var(--secondary-color);
			}

			section {
				max-width: 800px;
				margin: 2rem auto;
				padding: 2.5rem;
				text-align: center;
				background-color: #1f1f1f;
				border-radius: 10px;
				box-shadow: 0 4px 10px var(--box-shadow-color);
				border: 1px solid var(--border-color);
				transition:
					transform 0.3s ease,
					box-shadow 0.3s ease;
			}

			section:hover {
				transform: translateY(-10px);
				box-shadow: var(--hover-effect);
			}

			section h2 {
				font-family: var(--header-font);
				font-size: 2.5rem;
				color: var(--accent-color);
				margin-bottom: 1rem;
				text-shadow: var(--text-glow);
			}

			p {
				font-size: 1.25rem;
				color: var(--secondary-color);
				margin-top: 1rem;
			}

			.home-footer {
				text-align: center;
				padding: 3rem;
				background: linear-gradient(to top, #232526, #414345);
				border-top: 5px solid var(--border-color);
				color: var(--secondary-color);
			}

			@media (max-width: 768px) {
				h1 {
					font-size: 3rem;
				}

				.sub-header,
				p {
					font-size: 1.1rem;
				}
			}
		</style>
	</head>
	<body>
		<header class="home-header">
			<h1>Advanced NHL Stats</h1>
			<p class="sub-header">For the nerds 🤓</p>
		</header>

		<section>
			<h2>About</h2>
			<p>
				A web app for comparing NHL players. Report any bugs on the GitHub repo linked at the top
				right. <br />
				*shot numbers may be off due to NHL API issues
			</p>
		</section>

		<section>
			<h2>Comparison Tool</h2>
			<p>
				This tool is for comparing two players stats from any position and any point in time. Want
				to compare a player from 1919 to a player in 2023? No problem.
			</p>
		</section>

		<section>
			<h2>Versus Tool</h2>
			<p>
				This tool is meant for pitting players against each other. Want to know how many times
				Gretzky scored on Roy? This is the tool for you.
			</p>
		</section>

    <section>
			<h2>TODO</h2>
      Things still left to do:
      <ul>
        <li>
          <del>Fix the player lookup dropdown</del>
        </li>
        <li>
          <h6>Refetch data from NHL API when a more concrete API is found</h6>
        </li>
        <li>
          <h6>Add support for Skater vs Skater on versus tool</h6>
        </li>
      </ul>
		</section>

		<footer class="home-footer">&copy; 2024 Advanced NHL Stats. All rights unreserved.</footer>
	</body>
</html>
