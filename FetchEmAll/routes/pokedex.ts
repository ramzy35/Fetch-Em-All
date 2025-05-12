import express from "express";
import { hasStarterLocal, pokeListLocal } from "../middleware/locals";
import { catchPokemon, changeCurrentPokemon, deleteMyPokemon, getMyPokemon, getMyPokemonById, levelPokemon, renamePokemon } from "../database";
import { secureMiddleware } from "../middleware/secureMiddleware";
import { FullPokemon } from "../interfaces";
import { ObjectId } from "mongodb";

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

pokedexRoute.get("/", pokeListLocal, secureMiddleware, hasStarterLocal, async (req, res) => {
    res.locals.currentPage = "pokedex";
    res.render("pokedex");
});

pokedexRoute.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default pokedexRoute;