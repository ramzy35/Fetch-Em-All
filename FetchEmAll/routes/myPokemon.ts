import express from "express";
import { getPokemonList } from "../middleware/getPokemonList";
import { Pokemon } from "./pokedex";

const myPokemonRoute = express.Router();

myPokemonRoute.get("/", async (req, res) => {
    res.locals.myPokemon = res.locals.pokemonList.filter((poke:Pokemon) => {
        return poke.name.includes("p")
    })
    // just testing if this works, now returns only pokemon with P in name
    // going to implement this fully when we start using mongoDB
    res.locals.currentPokemon = res.locals.myPokemon[3]
    res.locals.currentPage = "myPokemon" 
    res.render("myPokemon");
});

export default myPokemonRoute;
