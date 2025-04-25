import express from "express";
import { Pokemon } from "./pokedex";

const wtpRoute = express.Router();

function rndmPokeId() {
    return Math.floor(Math.random()*151)+1
}

wtpRoute.get("/", async (req, res) => {
    res.locals.currentPage = "wtp"
    const pokemonNames = res.locals.pokemonNameList
    res.render("wtp", {
        rndmPokeId,
        pokemonNames
    });
});

export default wtpRoute;