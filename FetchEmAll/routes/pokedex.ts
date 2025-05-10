import express from "express";
import { pokeListLocal } from "../middleware/locals";
import { catchPokemon, changeCurrentPokemon, deleteMyPokemon, getMyPokemonById, levelPokemon, renamePokemon } from "../database";
import { secureMiddleware } from "../middleware/secureMiddleware";

const pokedexRoute = express.Router();

pokedexRoute.post("/choose-starter", secureMiddleware, async (req, res) => {
    const { starterId } = req.body;
    await deleteMyPokemon(res.locals.user._id)
    await catchPokemon(parseInt(starterId), res.locals.user._id, 20)
    await changeCurrentPokemon(parseInt(starterId), res.locals.user._id)
    await levelPokemon(parseInt(starterId), res.locals.user._id)
    await renamePokemon(parseInt(starterId), res.locals.user._id, "IT WORKS")
    console.log("Starter chosen:", starterId);
    res.redirect("/pokedex?hasStarter=true");
});

pokedexRoute.get("/", pokeListLocal, secureMiddleware, async (req, res) => {
    res.locals.currentPage = "pokedex";
    const hasStarter = req.query.hasStarter === "true";
    res.render("pokedex", { hasStarter });
});

export default pokedexRoute;