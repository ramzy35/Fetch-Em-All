class Pokemon1 {
    name: string = "";
    id: number;
    types: string[] = [];
    frontImg: string = "";
    typeColor: string = "#fff";
    didYouCatchEm: boolean = false;

    constructor(id: number) {
        this.id = id;
    }
    

    async fetchPokemonDataById(): Promise<Pokemon1> {
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

async function getPokemonList1(): Promise<Pokemon1[]> {
    let promises: Promise<Pokemon1>[] = [];

    for (let i = 1; i <= 151; i++) {
        let poke = new Pokemon1(i);
        promises.push(poke.fetchPokemonDataById());
    }

    return Promise.all(promises);
}

async function showRandomImage(): Promise<string>{
    let randomId = Math.floor(Math.random()*151)
    let pokeTest = new Pokemon1(randomId)
    let imgUrl = pokeTest.frontImg;
    try {
        const imgElement = document.getElementById("wtp__image")
        if(imgElement){
            imgElement.textContent = imgUrl;
        } else {
            console.log("imgElement does not exist")
        }

    } catch {
        console.log("Failed to insert imgUrl into #wtp__img")
    }

    return imgUrl
}

document.addEventListener("DOMContentLoaded", async () => {
    showRandomImage();
});