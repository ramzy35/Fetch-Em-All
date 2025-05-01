import express from "express";
import { pokeNamesLocal } from "../middleware/locals";
import { getPokemonById } from "../database";

const pokemonRoute = express.Router();

pokemonRoute.get("/", pokeNamesLocal, async (req, res) => {
        const id:number = typeof req.query.id === "string" ? parseInt(req.query.id) : 1;
        // give statpage of id 1 instead of infinite loading when no id is given
        const poke = await getPokemonById(id)
        res.locals.currentPage = "pokemon"
        
        res.render("pokemon", {pokemon: poke[0]});
});

export default pokemonRoute;