import express from "express";
import { pokeListLocal } from "../middleware/locals";
import { PokemonStats } from "../pokemonStats";

const myPokemonRoute = express.Router();

myPokemonRoute.get("/", pokeListLocal, async (req, res) => {
    res.locals.myPokemon = res.locals.pokemonList.filter((poke:PokemonStats) => {
        return poke.name.includes("p")
    })
    // just testing if this works, now returns only pokemon with P in name
    // going to implement this fully when we start using mongoDB
    res.locals.currentPokemon = res.locals.myPokemon[3]
    res.locals.currentPage = "myPokemon" 
    res.render("myPokemon");
});

export default myPokemonRoute;