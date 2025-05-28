import * as type from "../interfaces";

/**
 * ============================================================================
 *  ⚙️  Documentation Notice
 * ============================================================================
 *
 * This file's inline documentation was initially generated with the help of AI.
 * All comments and descriptions have been carefully reviewed and proofread by
 * the developer to ensure accuracy and clarity.
 *
 * ============================================================================
 */

/**
 * Retrieves a list of the first 151 Pokémon.
 *
 * This function asynchronously fetches Pokémon data for all Pokémon with IDs from 1 to 151.
 * It uses the `getPokemon` function to retrieve individual Pokémon and returns a promise
 * that resolves to an array of `Pokemon` objects.
 *
 * Any errors encountered during individual fetches are logged to the console, but do not
 * halt the overall execution of the function.
 *
 * @returns {Promise<type.Pokemon[]>} A promise that resolves to an array of Pokémon objects.
 */
export async function getPokemonList():Promise<type.Pokemon[]> { 
    const promises = [];
    for (let id = 1; id <= 151; id++) {
        try {
            promises.push(getPokemon(id));
        } catch (error) {
            console.log(error)
        }
    }
    const results:type.Pokemon[] = await Promise.all(promises);
    return results
}

/**
 * Fetches detailed data for a single Pokémon by ID.
 *
 * This function retrieves comprehensive information for a specific Pokémon from the PokeAPI.
 * It performs multiple API calls to fetch:
 * - Basic Pokémon data (e.g., stats, types, sprites)
 * - Species-specific information (e.g., habitat, evolution chain URL, generation)
 * - Evolution chain details to construct the full evolution path
 * - Type-based damage relations
 * - Descriptions of abilities
 *
 * The function combines this information into a single `Pokemon` object.
 *
 * @param {number} id - The ID of the Pokémon to fetch (1–151).
 * @returns {Promise<type.Pokemon>} A promise that resolves to a `Pokemon` object containing all enriched data.
 *
 * @throws Will throw an error if any of the fetch operations fail due to network or data issues.
 */
export async function getPokemon(id:number):Promise<type.Pokemon> {
    const pokemonResponse : Response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemonJson = await pokemonResponse.json();

    const speciesResponse : Response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
    const speciesJson = await speciesResponse.json();

    const evolutionResponse : Response = await fetch(speciesJson.evolution_chain.url);
    const evolutionJson = await evolutionResponse.json();
    const evolutionNames : string[] = getFullEvolutionPath(evolutionJson, pokemonJson.name);

    const types = pokemonJson.types ? pokemonJson.types.map((t: any) => t.type.name) : [];
    let combinedDamage: string[][] | null = null;
    if (types.length == 2){
        const type1 = await fetch(`https://pokeapi.co/api/v2/type/${types[0]}`);
        const type1Json = await type1.json();
        const type1Damage : string[][] = extractDamageFromTypes(type1Json);
        const type2 = await fetch(`https://pokeapi.co/api/v2/type/${types[1]}`);
        const type2Json = await type2.json();
        const type2Damage : string[][] = extractDamageFromTypes(type2Json);
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
    const abilities : type.AbilityDescription[]= await getAbilityDescriptions(pokemonJson.abilities);

    const poke:type.Pokemon = {
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

/**
 * Constructs the full evolution path of a Pokémon based on a provided evolution chain.
 *
 * Traverses the evolution tree recursively to find the evolution path that includes the target Pokémon.
 * Once found, it also collects all subsequent evolutions from that point onward.
 *
 * @param {type.EvolutionChain} evolutionData - The full evolution chain object from the PokeAPI.
 * @param {string} target - The name of the Pokémon for which to find the evolution path.
 * @returns {string[]} An ordered array of Pokémon names representing the full evolution path.
 */
function getFullEvolutionPath(evolutionData: type.EvolutionChain, target: string): string[] {
    let result: string[] = [];
  
    function traverse(chain: type.EvolutionChainLink, path: string[]) {
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
  
    function collectFurtherEvolutions(chain: type.EvolutionChainLink, path: string[]) {
      for (const evo of chain.evolves_to) {
        path.push(evo.species.name);
        collectFurtherEvolutions(evo, path);
      }
    }
  
    traverse(evolutionData.chain, []);
    return result;
}

/**
 * Fetches basic information for a list of Pokémon names.
 *
 * Sends parallel API requests to the PokeAPI for each Pokémon in the provided list and extracts
 * minimal information: ID, name, and front image URL. If any fetch fails, an error is thrown.
 *
 * @param {string[]} names - An array of Pokémon names to retrieve information for.
 * @returns {Promise<type.PokemonInfo[]>} A promise that resolves to an array of `PokemonInfo` objects.
 *
 * @throws Will throw an error if any individual fetch request fails.
 */
async function getEvolutions(names: string[]): Promise<type.PokemonInfo[]> {
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

/**
 * Extracts and formats the effort values (EVs) from a Pokémon's stats.
 *
 * Filters out stats with zero effort values, then maps and formats the remaining ones
 * into a human-readable string (e.g., "2 attack, 1 speed").
 *
 * @param {type.Stat[]} stats - An array of stat objects, each containing an `effort` value and `stat.name`.
 * @returns {string} A comma-separated string listing non-zero effort stats with their values.
 */
function getEffortStats(stats: type.Stat[]): string {
    return stats.filter(s => s.effort > 0)
        .map(s => `${s.effort} ${s.stat.name}`)
        .join(', ');
}

/**
 * Fetches the English short effect descriptions for a list of Pokémon abilities.
 *
 * For each ability provided, this function makes a request to the corresponding API URL,
 * extracts the English language entry from the effect entries, and compiles a list
 * of ability names and their descriptions.
 *
 * @param abilities - An array of `AbilityInfo` objects, each containing the name and API URL of a Pokémon ability.
 * @returns A Promise that resolves to an array of `AbilityDescription` objects containing the ability name and its description.
 */
async function getAbilityDescriptions(abilities: type.AbilityInfo[]): Promise<type.AbilityDescription[]> {
    const results: type.AbilityDescription[] = [];

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

/**
 * Extracts and categorizes damage multipliers for a given Pokémon type based on type effectiveness.
 *
 * This function parses the `damage_relations` object of a type fetched from the Pokémon API.
 * It organizes the types into categories based on how much damage they deal to the given type.
 * Only single-type calculations are supported (i.e., 1/4x and 4x are not applicable).
 *
 * @param data - An object containing a `damage_relations` field with effectiveness data. Expected to match the structure returned by the Pokémon type API.
 * @returns A 2D array of strings where each inner array contains type names that match the corresponding damage multiplier:
 * - Index 0: Types that deal 0× damage.
 * - Index 1: Empty (1/4× not applicable).
 * - Index 2: Types that deal 1/2× damage.
 * - Index 3: Types that deal 1× damage (i.e., not explicitly listed in the API).
 * - Index 4: Types that deal 2× damage.
 * - Index 5: Empty (4× not applicable).
 */
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

/**
 * Maps an index representing a damage category to its corresponding damage multiplier.
 *
 * This function is typically used to interpret the index returned by damage categorization functions,
 * such as `extractDamageFromTypes`, and convert it into an actual numerical damage multiplier.
 *
 * @param index - A numeric index from 0 to 5 representing damage categories:
 * - 0 → 0×
 * - 1 → 0.25×
 * - 2 → 0.5×
 * - 3 → 1×
 * - 4 → 2×
 * - 5 → 4×
 *
 * @returns The corresponding damage multiplier as a number. Defaults to 1 if the index is unrecognized.
 */
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

/**
 * Maps a damage multiplier to its corresponding index category.
 *
 * This function is the inverse of `indexToMultiplierMapper` and converts a numerical
 * damage multiplier into a standardized index used for categorizing damage.
 *
 * @param multiplier - A damage multiplier value (e.g., 0, 0.25, 0.5, 1, 2, or 4).
 * @returns The index corresponding to the multiplier:
 * - 0 → 0
 * - 0.25 → 1
 * - 0.5 → 2
 * - 1 → 3
 * - 2 → 4
 * - 4 → 5
 * Returns 3 (normal damage) if the multiplier is not in the mapping.
 */
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

/**
 * Combines the damage multipliers from two Pokémon types into a single aggregated damage profile.
 *
 * Given two arrays representing damage categories for two types (each a 2D string array
 * where each inner array contains types dealing specific damage multipliers),
 * this function calculates the combined damage multipliers by multiplying
 * the individual multipliers from each type.
 *
 * The resulting combined damage categories are returned in the same 2D array format,
 * indexed by damage multiplier categories (0×, 0.25×, 0.5×, 1×, 2×, 4×).
 *
 * @param type1 - A 2D array of strings representing the damage categories for the first type.
 * @param type2 - A 2D array of strings representing the damage categories for the second type.
 * @returns A 2D array of strings categorizing types by their combined damage multiplier against the dual type.
 */
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