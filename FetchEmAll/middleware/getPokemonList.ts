import { Request, Response, NextFunction} from "express";
import { getPokemonStats, PokemonStats } from "../pokemonStats";
import { getAllPokemon } from "../database";

export async function getPokemonList() { 
    const promises = [];
    for (let id = 1; id <= 151; id++) {
        promises.push(await getPokemonStats(id));
    }
    const results:PokemonStats[] = await Promise.all(promises);
    return results
}

export async function pokeListLocal(req: Request, res: Response, next: NextFunction) {
    const pokeList = await getAllPokemon()
    res.locals.pokemonList = pokeList
    next();
}