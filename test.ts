async function getPokemonById(id: number) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);

        if (!response.ok) {
            throw new Error(`Pokémon not found: ${response.statusText}`);
        }

        const pokemon = await response.json();

        console.log(`Name: ${pokemon.name}`);
        console.log(`ID: ${pokemon.id}`);
    } catch (error) {
        console.error("Error fetching Pokémon:", error);
    }
}

// const pokemonId = process.argv[2];

// if (!pokemonId || isNaN(Number(pokemonId))) {
//     console.error("Please provide a valid Pokémon ID!");
//     process.exit(1);
// }

//getPokemonById(Number(pokemonId));

async function test() {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/1`);
        if (!response.ok) throw new Error(`Pokemon not found: ${response.statusText}`);

        const data = await response.json();

        const nameElement = document.querySelector(".pokedex__card__name") as HTMLElement;

        nameElement.textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1); // Capitalized name

    } catch (error) {
        console.error("Error fetching Pokémon", error);
    }
}

test();