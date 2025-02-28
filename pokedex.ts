class Pokemon {
    name: string = "";
    id: number;
    types: string[] = [];
    frontImg: string = "";
    typeColor: string = "#fff";
    didYouCatchEm: boolean = false;

    constructor(id: number) {
        this.id = id;
    }

    //TODO: idk if this is needed, just for storing data in the class
    // the actual bg color is changed on line 79
    private static getTypeColor(type: string): string {
        const typeColors: { [key: string]: string } = {
            bug: "#9dc130",
            dark: "#5f606d",
            dragon: "#0773c7",
            electric: "#edd53f",
            fairy: "#ef97e6",
            fighting: "#d94256",
            fire: "#fc6c6d",
            flying: "#9bb4e8",
            ghost: "#7975d3",
            grass: "#5dbd62",
            ground: "#d78555",
            ice: "#97d7d7",
            normal: "#9a9da1",
            poison: "#b462cc",
            psychic: "#f85888",
            rock: "#c2b062",
            steel: "#b8b8d0",
            water: "#60a5fa"
        };
        return typeColors[type] || "#fff";
    }

    async fetchPokemonDataById(): Promise<Pokemon> {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${this.id}`);
            if (!response.ok) throw new Error(`Pokemon not found: ${response.statusText}`);
            const data = await response.json();

            this.name = data.name;
            this.types = data.types ? data.types.map((t: any) => t.type.name) : [];
            this.frontImg = data.sprites.front_default;
            this.typeColor = Pokemon.getTypeColor(this.types[0]);

            return this;
        } catch (error) {
            console.error("Error fetching Pokémon", error);
            return this;
        }
    }

    //TODO: release/catch needed??? toggle between catch and release
    catchEm() {
        this.didYouCatchEm = !this.didYouCatchEm;
        const card = document.querySelector(`.pokedex__card[data-id='${this.id}']`) as HTMLElement;
        if (card) {
        card.style.borderColor = this.didYouCatchEm ? "#05d605" : "#ac2323";
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

    list.forEach(pokemon => {
        const card = document.createElement("section");
        card.classList.add("pokedex__card", `type-${pokemon.types[0]}`);
        card.setAttribute("data-id", pokemon.id.toString());

        const left = document.createElement("section");
        left.classList.add("pokedex__card__left");

        const idElement = document.createElement("p");
        idElement.classList.add("pokedex__card__left__id");
        idElement.textContent = `#${pokemon.id}`;

        const nameElement = document.createElement("h2");
        nameElement.classList.add("pokedex__card__left__name");
        nameElement.textContent = pokemon.name;

        

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

// document.addEventListener("DOMContentLoaded", async () => {
//     getPokemonList().then(pokemonList => {
//         buildPokedex(pokemonList);
//     });
// });

document.addEventListener("DOMContentLoaded", async () => {
    const pokemonList = await getPokemonList();
    buildPokedex(pokemonList);
    const firstPokemon = pokemonList[0];
    const secondPoke = pokemonList[4];
    firstPokemon.catchEm();
    secondPoke.catchEm();  
});
