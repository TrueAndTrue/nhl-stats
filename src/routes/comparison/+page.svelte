<script context="module" lang="ts">
	 /** @type {import('./$types').PageData} */
	export let data: any;
</script>

<script lang="ts">
	import { Input, ButtonGroup, Button, Dropdown, DropdownItem } from 'flowbite-svelte';
  import { ChevronDownSolid } from 'flowbite-svelte-icons';
	import avatarEmpty from '$lib/images/avatar-empty.png';

	console.log("PAGE DATA", data);

	if (data) {
		console.log(data, "GOT DATA");
	}

	const stats = [
    { value: "hit", label: "Hit" },
    { value: "faceoff", label: "Faceoff" },
    { value: "shot", label: "Shot" },
    { value: "penalty", label: "Penalty" },
    { value: "missed_shot", label: "Missed Shot" },
		{ value: "blocked_shot", label: "Blocked Shot" },
		{ value: "giveaway", label: "Giveaway" }
  ];

	const positions = [
		{ value: "C", label: "Center" },
		{ value: "LW", label: "Left Wing" },
		{ value: "RW", label: "Right Wing" },
		{ value: "D", label: "Defense" },
		{ value: "G", label: "Goalie" }
	]

	let chosenStat = "Shot";
	let chosenPosition1 = "Choose position";
	let chosenPosition2 = "Choose position";


</script>

<svelte:head>
	<title>About</title>
	<meta name="description" content="About this app" />
</svelte:head>

<div class="container">
	<div class="flex justify-center">
		<h1>Player Comparison Tool</h1>
	</div>
	<div class="sub-container">
		<div class="left-sub-container">
			<div>
				<h2>Player 1</h2>
				<img src={avatarEmpty} alt="avatar 1" />
				<div>
					<ButtonGroup class="w-full flex flex-col">
						<Button color="none" class="w-full flex-shrink-0 text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800">
							{chosenPosition1}<ChevronDownSolid class="w-3 h-3 ms-2 text-white dark:text-white" />
						</Button>
						<Dropdown>
							{#each positions as position}
								<DropdownItem value={position.value} on:click={() => chosenPosition1 = position.label}>{position.label}</DropdownItem>
							{/each}
						</Dropdown>
						<Input placeholder="Find Player" />
					</ButtonGroup>
				</div>
			</div>
		</div>
		<div class="middle-sub-container">
			<div class="flex justify-center align-center">
				<ButtonGroup class="w-full">
					<Button color="none" class="min-w-60 flex-shrink-0 text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800">
						{chosenStat}<ChevronDownSolid class="w-3 h-3 ms-2 text-white dark:text-white" />
					</Button>
					<Dropdown>
						{#each stats as stat}
							<DropdownItem value={stat.value} on:click={() => chosenStat = stat.label}>{stat.label}</DropdownItem>
						{/each}
					</Dropdown>
				</ButtonGroup>
			</div>
			<div>
				<Button color="red">
					Send query
				</Button>
			</div>
		</div>
		<div class="right-sub-container">
			<div>
				<h2>Player 2</h2>
				<img src={avatarEmpty} alt="avatar 2">
				<ButtonGroup class="w-full flex flex-col">
					<Button color="none" class="w-full flex-shrink-0 text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800">
						{chosenPosition2}<ChevronDownSolid class="w-3 h-3 ms-2 text-white dark:text-white" />
					</Button>
					<Dropdown>
						{#each positions as position}
								<DropdownItem value={position.value} on:click={() => chosenPosition2 = position.label}>{position.label}</DropdownItem>
						{/each}
					</Dropdown>
					<Input placeholder="Find Player" />
				</ButtonGroup>
			</div>
		</div>
	</div>
</div>

<style>

	@import 'tailwindcss/base';
  @import 'tailwindcss/components';
  @import 'tailwindcss/utilities';
	
	.container {
		display: flex;
		flex-direction: column;
		background-color: aliceblue;
		height: 100%;
		width: 100%;
	}

	.sub-container {
		display: flex;
		flex-direction: row;
		padding: 1.5rem;
	}

	.left-sub-container {
		flex: 1;
		background-color: bisque;
		border: 1px solid red;
	}

	.middle-sub-container {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		flex: 3;
		background-color: bisque;
		border: 1px solid red;
	}

	.right-sub-container {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: flex-end;
		background-color: bisque;
		border: 1px solid red;
	}
</style>