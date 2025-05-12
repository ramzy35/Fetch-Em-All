import express, { query } from "express";
import { hasStarterLocal, pokeListLocal } from "../middleware/locals";
import { catchPokemon, changeCurrentPokemon, deleteMyPokemon, getMyPokemon, getMyPokemonById, levelPokemon, renamePokemon } from "../database";
import { secureMiddleware } from "../middleware/secureMiddleware";
import { FullPokemon } from "../interfaces";
import { ObjectId } from "mongodb";

const pokedexRoute = express.Router();

pokedexRoute.post("/choose-starter", secureMiddleware, async (req, res) => {
    const { starterId } = req.body;

    const userId = res.locals.user._id;
    const starterIdNum = parseInt(starterId);
    await deleteMyPokemon(userId);
    await catchPokemon(starterIdNum, userId, 0);
    await changeCurrentPokemon(starterIdNum, userId);
    await levelPokemon(starterIdNum, userId);

    console.log("Starter chosen:", starterId);

    res.redirect(`/pokedex?justChoseStarter=1&starterId=${starterIdNum}`);
});

pokedexRoute.get("/", pokeListLocal, secureMiddleware, hasStarterLocal, async (req, res) => {
    res.locals.currentPage = "pokedex";
    res.render("pokedex", { hasStarter: res.locals.hasStarter, query: req.query });
});

pokedexRoute.post("/nickname",secureMiddleware, async (req, res) => {
    const { nickname, starterId } = req.body;
    const userId = res.locals.user._id;

    if (starterId && nickname) {
        await renamePokemon(parseInt(starterId, 10), userId, nickname);
        console.log(`Nickname set: ${nickname} for Pokémon ID ${starterId}`);
    }

    res.redirect("/pokedex");
});

pokedexRoute.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default pokedexRoute;