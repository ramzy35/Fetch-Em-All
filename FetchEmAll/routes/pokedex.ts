import express from "express";
import { hasStarterLocal, pokeListLocal } from "../middleware/locals";
import { catchPokemon, changeCurrentPokemon, deleteMyPokemon, renamePokemon } from "../database";
import { secureMiddleware } from "../middleware/secureMiddleware";
import { ObjectId } from "mongodb";

const pokedexRoute = express.Router();

pokedexRoute.post("/choose-starter", secureMiddleware, async (req, res) => {
    const starterId : number = parseInt(req.body.starterId);
    const userId : ObjectId = res.locals.user._id;
    const starterIdNum : number = starterId;

    await deleteMyPokemon(userId);
    await catchPokemon(starterIdNum, userId, 1);
    await changeCurrentPokemon(starterIdNum, userId);

    res.redirect(`/pokedex?justChoseStarter=1&starterId=${starterIdNum}`);
});

pokedexRoute.get("/", pokeListLocal, secureMiddleware, hasStarterLocal, async (req, res) => {
    res.locals.currentPage = "pokedex";
    res.render("pokedex", { 
        hasStarter: res.locals.hasStarter, 
        query: req.query 
    });
});

pokedexRoute.post("/nickname",secureMiddleware, async (req, res) => {
    const nickname : string = req.body.nickname;
    const starterId : number = parseInt(req.body.starterId)
    const userId : ObjectId = res.locals.user._id;

    if (starterId && nickname) {
        await renamePokemon(starterId, userId, nickname);
    }

    res.redirect("/pokedex");
});

pokedexRoute.get("/:status", async (_req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default pokedexRoute;