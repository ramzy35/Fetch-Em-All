import * as pokeStats from "../pokemonStats";

export async function getPokemonList():Promise<pokeStats.PokemonStats[]> { 
    const promises = [];
    for (let id = 1; id <= 151; id++) {
        try {
            promises.push(getPokemonStats(id));
        } catch (error) {
            console.log(error)
        }
    }
    const results:pokeStats.PokemonStats[] = await Promise.all(promises);
    return results
}

export async function getPokemonStats(id:number):Promise<pokeStats.PokemonStats> {
    const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemonJson = await pokemonResponse.json();

    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
    const speciesJson = await speciesResponse.json();

    const evolutionResponse = await fetch(speciesJson.evolution_chain.url);
    const evolutionJson = await evolutionResponse.json();
    const evolutionNames = getFullEvolutionPath(evolutionJson, pokemonJson.name);

    const types = pokemonJson.types ? pokemonJson.types.map((t: any) => t.type.name) : [];
    let combinedDamage: string[][] | null = null;
    if (types.length == 2){
        const type1 = await fetch(`https://pokeapi.co/api/v2/type/${types[0]}`);
        const type1Json = await type1.json();
        const type1Damage = extractDamageFromTypes(type1Json);
        const type2 = await fetch(`https://pokeapi.co/api/v2/type/${types[1]}`);
        const type2Json = await type2.json();
        const type2Damage = extractDamageFromTypes(type2Json);
        combinedDamage = combineDamageFromTypes(type1Damage, type2Damage);
    } else {
        const type1 = await fetch(`https://pokeapi.co/api/v2/type/${types[0]}`);
        const type1Json = await type1.json();
        combinedDamage = extractDamageFromTypes(type1Json);
    }

    let evolutionChain = null;
    if (evolutionNames.length != 1) {
        evolutionChain = await getEvolutions(evolutionNames);
    }
    const abilities = await getAbilityDescriptions(pokemonJson.abilities);

    const poke:pokeStats.PokemonStats = {
        name: pokemonJson.name,
        id: pokemonJson.id,
        front_image: pokemonJson.sprites.front_default,
        types: types,
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
        type_damage: combinedDamage,
    };
    
    return poke;
}

function getFullEvolutionPath(evolutionData: pokeStats.EvolutionChain, target: string): string[] {
    let result: string[] = [];
  
    function traverse(chain: pokeStats.EvolutionChainLink, path: string[]) {
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
  
    function collectFurtherEvolutions(chain: pokeStats.EvolutionChainLink, path: string[]) {
      for (const evo of chain.evolves_to) {
        path.push(evo.species.name);
        collectFurtherEvolutions(evo, path);
      }
    }
  
    traverse(evolutionData.chain, []);
    return result;
}


  
async function getEvolutions(names: string[]): Promise<pokeStats.PokemonInfo[]> {
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


  
function getEffortStats(stats: pokeStats.Stat[]): string {
    return stats.filter(s => s.effort > 0)
        .map(s => `${s.effort} ${s.stat.name}`)
        .join(', ');
}


  
async function getAbilityDescriptions(abilities: pokeStats.AbilityInfo[]): Promise<pokeStats.AbilityDescription[]> {
    const results: pokeStats.AbilityDescription[] = [];

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

function extractDamageFromTypes(data: any): string[][] {
    const allTypes = [
        "normal", "fighting", "flying", "poison", "ground", "rock",
        "bug", "ghost", "steel", "fire", "water", "grass", "electric",
        "psychic", "ice", "dragon", "dark", "fairy"
    ];

    const {
        no_damage_from = [],
        half_damage_from = [],
        double_damage_from = [],
    } = data.damage_relations;

    const noDamage = no_damage_from.map((t: { name: string; url: string }) => t.name);
    const halfDamage = half_damage_from.map((t: { name: string; url: string }) => t.name);
    const doubleDamage = double_damage_from.map((t: { name: string; url: string }) => t.name);

    const mentioned = new Set([...noDamage, ...halfDamage, ...doubleDamage]);
    const normalDamage = allTypes.filter(type => !mentioned.has(type));

    return [
        noDamage,     // 0x
        [],           // 1/4x (not applicable for single type)
        halfDamage,   // 1/2x
        normalDamage, // 1x (not mentioned)
        doubleDamage, // 2x
        []            // 4x (not applicable for single type)
    ];
}

export const indexToMultiplierMapper = (index: number): number => {
    const mapping: Record<number, number> = {
        0: 0,
        1: 0.25,
        2: 0.5,
        3: 1,
        4: 2,
        5: 4
    };
    return mapping[index] ?? 1;
};

export const multiplierToIndexMapper = (multiplier: number): number => {
    const mapping: Record<number, number> = {
        0: 0,
        0.25: 1,
        0.5: 2,
        1: 3,
        2: 4,
        4: 5
    };
    return mapping[multiplier] ?? 3;
};

function combineDamageFromTypes(type1: string[][], type2: string[][]): string[][] {
    const allTypes = [
        "normal", "fighting", "flying", "poison", "ground", "rock",
        "bug", "ghost", "steel", "fire", "water", "grass", "electric",
        "psychic", "ice", "dragon", "dark", "fairy"
    ];
    
    const combinedMap: Record<string, number> = {};

    for (const type of allTypes) {
        let index1 = type1.findIndex(arr => arr.includes(type));
        let index2 = type2.findIndex(arr => arr.includes(type));
        if (index1 === -1)
            index1 = 3;
        if (index2 === -1)
            index2 = 3;

        const m1 = indexToMultiplierMapper(index1);
        const m2 = indexToMultiplierMapper(index2);

        const combinedMultiplier = m1 * m2;

        combinedMap[type] = combinedMultiplier;
    }

    const result: string[][] = [[], [], [], [], [], []];
    for (const [type, multiplier] of Object.entries(combinedMap)) {
        const index = multiplierToIndexMapper(multiplier);
        result[index].push(type);
    }

    return result;
}