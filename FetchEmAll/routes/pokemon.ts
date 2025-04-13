import express from "express";
import { Pokemon } from "./pokedex";

const pokemonRoute = express.Router();

export interface PokemonStats {
    name: string,
    id: number,
    front_image: string,
    types: string[],
    height: number,
    weight: number,
    evolution_chain: PokemonInfo[],
}

type EvolutionDetail = {
    min_level: number | null;
    trigger: { name: string; url: string };
    // THE REST IS NOT NEEDED
};
  
type EvolutionChainLink = {
    species: { name: string; url: string };
    evolves_to: EvolutionChainLink[];
    evolution_details: EvolutionDetail[];
    is_baby: boolean;
};
  
type EvolutionChain = {
    id: number;
    baby_trigger_item: any;
    chain: EvolutionChainLink;
};

function getEvolutionNames(evolutionData: EvolutionChain): string[] {
    const names: string[] = [];

    function traverse(chain: EvolutionChainLink) {
        names.push(chain.species.name);
        if (chain.evolves_to.length > 0) {
            traverse(chain.evolves_to[0]);
        }
    }
    traverse(evolutionData.chain);
    return names;
}

type PokemonInfo = {
    id: number;
    name: string;
    front_default: string;
};
  
async function getPokemonList(names: string[]): Promise<PokemonInfo[]> {
    const pokemonData = await Promise.all(
        names.map(async (name) => {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data for ${name}`);
            }
            const data = await response.json();
            return {
                id: data.id,
                name: data.name,
                front_default: data.sprites.front_default,
            };
        })
    );
  
    return pokemonData;
}

pokemonRoute.get("/", async (req, res) => {
    if (typeof req.query.id === "string")
    {
        const id = req.query.id;
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${req.query.id}`);
        const pokemonJson = await pokemonResponse.json();

        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${req.query.id}`)
        const speciesJson = await speciesResponse.json();

        const evolutionResponse = await fetch(speciesJson.evolution_chain.url);
        const evolutionJson = await evolutionResponse.json();
        const evolutionNames = getEvolutionNames(evolutionJson);
        const evolutionChain = await getPokemonList(evolutionNames);

        const poke:PokemonStats = {
            name: pokemonJson.name,
            id: pokemonJson.id,
            front_image: pokemonJson.sprites.front_default,
            types: pokemonJson.types ? pokemonJson.types.map((t: any) => t.type.name) : [],
            height: pokemonJson.height,
            weight: pokemonJson.weight,
            evolution_chain: evolutionChain,
        };

        res.render("pokemon", {pokemon: poke});
    }
    
});

export default pokemonRoute;