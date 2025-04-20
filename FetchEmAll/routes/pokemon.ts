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
    hp: number,
    attack: number,
    defense: number,
    special_attack: number,
    special_defense: number,
    speed: number,
    generation: string,
    habitat: string,
    capture_rate: number,
    growth_rate: string,
    ev_yield: string,
    base_experience: number,
    base_happiness: string,
    abilities: AbilityDescription[],
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

type Stat = {
    base_stat: number;
    effort: number;
    stat: {
        name: string;
        url: string;
    };
};
  
function getEffortStats(stats: Stat[]): string {
    return stats.filter(s => s.effort > 0)
        .map(s => `${s.effort} ${s.stat.name}`)
        .join(', ');
}

type AbilityInfo = {
    ability: {
        name: string;
        url: string;
    };
    is_hidden: boolean;
    slot: number;
};
  
type AbilityDescription = {
    name: string;
    description: string;
};
  
async function getAbilityDescriptions(abilities: AbilityInfo[]): Promise<AbilityDescription[]> {
    const results: AbilityDescription[] = [];

    for (const abilityEntry of abilities) {
        const res = await fetch(abilityEntry.ability.url);
        const data = await res.json();

        const englishEntry = data.effect_entries.find(
            (entry: any) => entry.language.name === "en"
        );

        if (englishEntry) {
            results.push({
                name: abilityEntry.ability.name,
                description: englishEntry.short_effect,
            });
        } else {
            results.push({
                name: abilityEntry.ability.name,
                description: "No English description found.",
            });
        }
    }

    return results;
}
  

export async function getPokemonStats(id:number) {
    const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemonJson = await pokemonResponse.json();

    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
    const speciesJson = await speciesResponse.json();

    const evolutionResponse = await fetch(speciesJson.evolution_chain.url);
    const evolutionJson = await evolutionResponse.json();
    const evolutionNames = getFullEvolutionPath(evolutionJson, pokemonJson.name);
    let evolutionChain = null;
    if (evolutionNames.length != 1) {
        evolutionChain = await getPokemonList(evolutionNames);
    }
    const abilities = await getAbilityDescriptions(pokemonJson.abilities);

    const poke:PokemonStats = {
        name: pokemonJson.name,
        id: pokemonJson.id,
        front_image: pokemonJson.sprites.front_default,
        types: pokemonJson.types ? pokemonJson.types.map((t: any) => t.type.name) : [],
        height: pokemonJson.height,
        weight: pokemonJson.weight,
        evolution_chain: evolutionChain,
        hp: pokemonJson.stats[0].base_stat,
        attack: pokemonJson.stats[1].base_stat,
        defense: pokemonJson.stats[2].base_stat,
        special_attack: pokemonJson.stats[3].base_stat,
        special_defense: pokemonJson.stats[4].base_stat,
        speed: pokemonJson.stats[5].base_stat,
        habitat: speciesJson.habitat.name,
        generation: speciesJson.generation.name,
        capture_rate: speciesJson.capture_rate,
        growth_rate: speciesJson.growth_rate.name,
        base_experience: pokemonJson.base_experience,
        ev_yield: getEffortStats(pokemonJson.stats),
        base_happiness: speciesJson.base_happiness,
        abilities: abilities,
    };
    
    return poke;
}

function typeMapper(input: string | number): string | number | null {
    const typeMap: Record<string, number> = {
        normal: 1,
        fighting: 2,
        flying: 3,
        poison: 4,
        ground: 5,
        rock: 6,
        bug: 7,
        ghost: 8,
        steel: 9,
        fire: 10,
        water: 11,
        grass: 12,
        electric: 13,
        psychic: 14,
        ice: 15,
        dragon: 16,
        dark: 17,
        fairy: 18,
    };

    if (typeof input === "string") {
        const lower = input.toLowerCase();
        return typeMap[lower] ?? null;
    } else if (typeof input === "number") {
        const reverseMap = Object.entries(typeMap).reduce<Record<number,string>>(
            (acc, [key, value]) => {
                acc[value] = key;
                return acc;
            },
            {}
        );
        return reverseMap[input] ?? null;
    }
    return null;
}

pokemonRoute.get("/", async (req, res) => {
        const id = typeof req.query.id === "string" ? parseInt(req.query.id) : 1;
        // give statpage of id 1 instead of infinite loading when no id is given
        const poke = await getPokemonStats(id)
        res.render("pokemon", {pokemon: poke});
});

export default pokemonRoute;