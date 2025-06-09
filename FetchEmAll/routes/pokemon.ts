import express from "express";
import { myPokemonLocal, pokeNamesLocal } from "../middleware/locals";
import { secureMiddleware } from "../middleware/secureMiddleware";
import { getPokemonById } from "../database";
import { Pokemon } from "../interfaces";

const pokemonRoute = express.Router();

pokemonRoute.get("/", secureMiddleware, pokeNamesLocal, myPokemonLocal, async (req, res) => {
    const id:number = typeof req.query.id === "string" ? parseInt(req.query.id) : 1;
    const poke:Pokemon = await getPokemonById(id)
    res.locals.currentPage = "pokemon"
    
    res.render("pokemon", {pokemon: poke});
});

pokemonRoute.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default pokemonRoute;