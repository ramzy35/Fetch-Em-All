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
}

pokemonRoute.get("/", async (req, res) => {
    if (typeof req.query.id === "string")
    {
        const id = req.query.id;
        const responsePokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${req.query.id}`);
        const pokemon = await responsePokemon.json();
        
        const poke:PokemonStats = {
            name: pokemon.name,
            id: pokemon.id,
            front_image: pokemon.sprites.front_default,
            types: pokemon.types ? pokemon.types.map((t: any) => t.type.name) : [],
            height: pokemon.height,
            weight: pokemon.weight,
        };
        
        
        res.render("pokemon", {pokemon: poke});
    }
    
});

export default pokemonRoute;