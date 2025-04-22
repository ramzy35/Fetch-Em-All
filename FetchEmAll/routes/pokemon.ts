import express from "express";
import { Pokemon } from "./pokedex";
import { getPokemonStats } from "../pokemonStats";

const pokemonRoute = express.Router();



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


// IDK IF WE NEED THIS, IMMA KEEP IT JUST BY THE OFFCHANCE WE DO
// function typeMapper(input: string | number): string | number | null {
//     const typeMap: Record<string, number> = {
//         normal: 1,
//         fighting: 2,
//         flying: 3,
//         poison: 4,
//         ground: 5,
//         rock: 6,
//         bug: 7,
//         ghost: 8,
//         steel: 9,
//         fire: 10,
//         water: 11,
//         grass: 12,
//         electric: 13,
//         psychic: 14,
//         ice: 15,
//         dragon: 16,
//         dark: 17,
//         fairy: 18,
//     };

//     if (typeof input === "string") {
//         const lower = input.toLowerCase();
//         return typeMap[lower] ?? null;
//     } else if (typeof input === "number") {
//         const reverseMap = Object.entries(typeMap).reduce<Record<number,string>>(
//             (acc, [key, value]) => {
//                 acc[value] = key;
//                 return acc;
//             },
//             {}
//         );
//         return reverseMap[input] ?? null;
//     }
//     return null;
// }

pokemonRoute.get("/", async (req, res) => {
        const id:number = typeof req.query.id === "string" ? parseInt(req.query.id) : 1;
        // give statpage of id 1 instead of infinite loading when no id is given
        const poke = await getPokemonStats(id)
        res.locals.currentPage = "pokemon"
        
        res.render("pokemon", {pokemon: poke});
});

export default pokemonRoute;