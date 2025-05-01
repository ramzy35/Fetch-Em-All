import express from "express";
import { pokeNamesLocal } from "../middleware/locals";
import { getPokemonById } from "../database";

const wtpRoute = express.Router();

function rndmPoke() {
    const rndmId : number = Math.floor(Math.random()*151)+1
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