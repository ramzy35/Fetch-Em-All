class Pokemon {
    name: string = "";
    id: number;
    types: string[] = [];
    frontImg: string = "";

    constructor(id: number) {
        this.id = id;
    }

    async fetchPokemonDataById(): Promise<Pokemon> {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${this.id}`);
            if (!response.ok) throw new Error(`Pokemon not found: ${response.statusText}`);
            const data = await response.json();

            this.name = data.name;
            this.types = data.types ? data.types.map((t: any) => t.type.name) : [];
            this.frontImg = data.sprites.front_default;

            return this;
        } catch (error) {
            console.error("Error fetching Pokémon", error);
            return this;
        }
    }
}

async function getPokemonList(): Promise<Pokemon[]> {
    let promises: Promise<Pokemon>[] = [];

    for (let i = 1; i <= 151; i++) {
        let poke = new Pokemon(i);
        promises.push(poke.fetchPokemonDataById());
    }

    return Promise.all(promises);
}

function buildPokedex(list: Pokemon[]) {
    const pokedexSection = document.querySelector(".pokedex");
    if (!pokedexSection) {
        console.log("Pokedex section not found?!");
        return;
    }

    pokedexSection.innerHTML = '<h1 class="pokedex__title">Pokedex</h1>';

    list.forEach(pokemon => {
        const card = document.createElement("section");
        card.classList.add("pokedex__card");

        const left = document.createElement("section");
        left.classList.add("pokedex__card__left");

        const nameElement = document.createElement("h2");
        nameElement.classList.add("pokedex__card__left__name");
        nameElement.textContent = pokemon.name;

        const idElement = document.createElement("p");
        idElement.classList.add("pokedex__card__left__id");
        idElement.textContent = `#${pokemon.id}`;

        const typesElement = document.createElement("p");
        typesElement.classList.add("pokedex__card__left__types");
        typesElement.textContent = pokemon.types.join(", ");


        left.appendChild(nameElement);
        left.appendChild(idElement);
        left.appendChild(typesElement);

        const frontImgElement = document.createElement("img");
        frontImgElement.classList.add("pokedex__card__img--front");
        frontImgElement.src = pokemon.frontImg;
        frontImgElement.alt = `${pokemon.name} image`;

        card.appendChild(left);
        card.appendChild(frontImgElement);
        pokedexSection.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    getPokemonList().then(pokemonList => {
        buildPokedex(pokemonList);
    });
});
// document.addEventListener("DOMContentLoaded", () => {
//     displayPokemonOnCard();
// });
