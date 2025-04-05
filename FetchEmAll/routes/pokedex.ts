import express from "express";
import { pokedexUtility } from "../middleware/pokedexUtility";

const pokedexRoute = express.Router();

interface Pokemon {
    name: string,
    id: number,
    front_image: string,
    types: string[],
}

async function getPokemonList() {
    const pokemonList:Pokemon[] = [];
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
    return results.filter(pokemon => pokemon !== null);
}

pokedexRoute.get("/", pokedexUtility, async (req, res) => {
    res.locals.pokemonList = await getPokemonList();
    res.render("pokedex");
});

export default pokedexRoute;