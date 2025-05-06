import express from "express";
import { pokeListLocal } from "../middleware/locals";
import { catchPokemon } from "../database";

const pokedexRoute = express.Router();

pokedexRoute.post("/choose-starter", (req, res) => {
    const { starterId } = req.body;
    catchPokemon(parseInt(starterId), 1, 0)
    console.log("Starter chosen:", starterId);
    res.redirect("/pokedex?hasStarter=true");
});

pokedexRoute.get("/", pokeListLocal, async (req, res) => {
    res.locals.currentPage = "pokedex";
    const hasStarter = req.query.hasStarter === "true";
    res.render("pokedex", { hasStarter });
});

export default pokedexRoute;