export class Pokemon {
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