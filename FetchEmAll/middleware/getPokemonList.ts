import { Request, Response, NextFunction} from "express";
import { Pokemon } from "../routes/pokedex";

export async function getPokemonList(req: Request, res: Response, next: NextFunction) {
    const baseUrl = "https://pokeapi.co/api/v2/pokemon/";
    
    const fetchPokemon = (id: number) => {
        return fetch(`${baseUrl}${id}`)
            .then(response => response.json())
            .then(data => ({
                name: data.name,
                id: data.id,
                front_image: data.sprites.front_default,
                types: data.types ? data.types.map((t: any) => t.type.name) : [],
            }))
            .catch(error => {
                console.error(`Failed to fetch data for Pokémon ID ${id}:`, error.message);
                return null;
            });
    };
    
    const promises = [];
    for (let id = 1; id <= 151; id++) {
        promises.push(fetchPokemon(id));
    }
    
    const results = await Promise.all(promises);
    res.locals.pokemonList = results;
    next();
}