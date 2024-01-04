<script>
  export let title = 'Advanced NHL Stats';

  const sections = [
    {
      heading: 'About',
      content: 'A web app for comparing NHL players. Report any bugs on the GitHub repo linked at the top right.'
    },
    {
      heading: 'Comparison Tool',
      content: 'This tool is for comparing two players stats from any position and any point in time. Want to compare a player from 1919 to a player in 2023? No problem.'
    },
		{
      heading: 'Versus Tool',
      content: 'This tool is meant for pitting players against eachother. Want to know how many times Gretzky scored on Roy? This is the tool for you.'
    }
  ];
</script>

<style lang="postcss">
  body {
    font-family: 'Poppins', sans-serif;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
  }

  header {
    background-color: #1a1a1a;
    color: white;
    padding: 2rem;
    text-align: center;
    border-radius: 16px;
  }

  section {
    max-width: 800px;
    margin: 1.5rem auto;
    padding: 2rem;
    background-color: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    transition: transform 0.3s ease-in-out;
  }

  section:hover {
    transform: scale(1.02);
  }

  h1 {
    color: white;
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  h2 {
    color: #1a1a1a;
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  p {
    color: #555;
    font-size: 1.2rem;
    line-height: 1.6;
  }

	.sub-header {
		color: white;
	}

  footer {
    text-align: center;
    padding: 2rem;
    background-color: #1a1a1a;
    color: white;
    border-radius: 16px;
  }
</style>

<header>
  <h1>{title}</h1>
  <p class="sub-header">For the nerds 🤓</p>
</header>

{#each sections as { heading, content }}
  <section class="min-w-full text-center">
    <h2>{heading}</h2>
    <p>{content}</p>
  </section>
{/each}

<footer>
  &copy; {new Date().getFullYear()} {title}. All rights unreserved.
</footer>
