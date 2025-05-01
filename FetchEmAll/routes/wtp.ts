import express from "express";
import { Pokemon } from "./pokedex";
import { pokeNamesLocal } from "../middleware/pokeNames";
import { getPokemonById } from "../database";

const wtpRoute = express.Router();

function rndmPoke() {
    const rndmId = Math.floor(Math.random()*151)+1
    const rndmPokemon = getPokemonById(rndmId)
    return rndmPokemon
}

wtpRoute.get("/", pokeNamesLocal, async (req, res) => {
    res.locals.currentPage = "wtp"
    const poke = await rndmPoke()
    res.render("wtp", {
        poke : poke[0],
    });
});

export default wtpRoute;