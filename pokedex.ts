class Pokemon {
    name: string;
    id: number;
    img: string;
    types: string[];

    constructor(name: string, id: number, img: string, types: string[]) {
        this.name = name;
        this.id = id;
        this.img = img;
        this.types = types;
    }
}

async function getPokemonInfoById(id: number): Promise<Pokemon | null> {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!response.ok)
            throw new Error(`Pokémon not found: ${response.statusText}`);
        const data = await response.json();
        return new Pokemon(
            data.name,
            data.id,
            data.sprites.front_default,
            data.types.map((type: any) => type.type.name)
        );
    } catch (error) {
        console.error("Error fetching Pokemon", error);
        return null;
    }
}

async function displayPokemonOnPokedexCard(id: number)
{
    const pokemon = await getPokemonInfoById(id);
    if (!pokemon) return; // STOP IF FAIL - OTHERWISE BOOOOOOM

    const nameElement = document.querySelector(".pokedex__card__name'") as HTMLElement;
    const idElement = document.querySelector(".pokedex__card__id'") as HTMLElement;
    const typesElement = document.querySelector(".pokedex__card__types'") as HTMLElement;
    const imgElement = document.querySelector(".pokedex__card__img-front'") as HTMLImageElement;

    nameElement.textContent = `${pokemon.name}`;
    idElement.textContent = `#${pokemon.id}`;
    typesElement.textContent = `${pokemon.types.join(", ")}`;
    imgElement.src = pokemon.img;
    imgElement.alt = `${pokemon.name} image`;
}

displayPokemonOnPokedexCard(1); // just for now slime