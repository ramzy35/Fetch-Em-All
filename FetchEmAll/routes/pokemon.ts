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
    evolution_chain: PokemonInfo[] | null,
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

// function getEvolutionNames(evolutionData: EvolutionChain): string[] {
//     const names: Set<string> = new Set();

//     // function traverse(chain: EvolutionChainLink) {
//     //     names.push(chain.species.name);
//     //     if (chain.evolves_to.length > 0) {
//     //         traverse(chain.evolves_to[0]);
//     //     }
//     // }
//     function traverse(chain: EvolutionChainLink) {
//         names.add(chain.species.name);
//         for (const evolution of chain.evolves_to) {
//           traverse(evolution);
//         }
//       }
//     traverse(evolutionData.chain);
//     return Array.from(names);
// }

function getFullEvolutionPath(evolutionData: EvolutionChain, target: string): string[] {
    let result: string[] = [];
  
    function traverse(chain: EvolutionChainLink, path: string[]) {
      const newPath = [...path, chain.species.name];
  
      if (chain.species.name === target) {
        collectFurtherEvolutions(chain, newPath);
        result = newPath;
        return true;
      }
  
      for (const evo of chain.evolves_to) {
        if (traverse(evo, newPath)) return true;
      }
  
      return false;
    }
  
    function collectFurtherEvolutions(chain: EvolutionChainLink, path: string[]) {
      for (const evo of chain.evolves_to) {
        path.push(evo.species.name);
        collectFurtherEvolutions(evo, path);
      }
    }
  
    traverse(evolutionData.chain, []);
    return result;
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
        const evolutionNames = getFullEvolutionPath(evolutionJson, pokemonJson.name);
        let evolutionChain = null;
        if (evolutionNames.length != 1) {
            evolutionChain = await getPokemonList(evolutionNames);
        }
        

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