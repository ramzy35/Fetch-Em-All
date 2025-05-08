import express from "express";
import { pokeListLocal } from "../middleware/locals";
import { catchPokemon, getMyPokemon } from "../database";

const pokedexRoute = express.Router();

pokedexRoute.post("/choose-starter", async (req, res) => {
    const { starterId } = req.body;
    await catchPokemon(parseInt(starterId), 1, 20)
    console.log("Starter chosen:", starterId);
    res.redirect("/pokedex?hasStarter=true");
});

pokedexRoute.get("/", pokeListLocal, async (req, res) => {
    res.locals.currentPage = "pokedex";
    const hasStarter = req.query.hasStarter === "true";
    res.render("pokedex", { hasStarter });
});

export default pokedexRoute;