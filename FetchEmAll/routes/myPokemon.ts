import express from "express";
import { ObjectId } from "mongodb";
import { changeCurrentPokemon, getCurrentPokemon } from "../database";
import { myPokemonLocal } from "../middleware/locals";
import { secureMiddleware } from "../middleware/secureMiddleware";

const myPokemonRoute = express.Router();

myPokemonRoute.get("/", secureMiddleware, myPokemonLocal, async (req, res) => {
    res.locals.currentPokemon =  await getCurrentPokemon(res.locals.user._id);
    res.locals.currentPage = "myPokemon";
    res.render("myPokemon");
});

myPokemonRoute.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
});

myPokemonRoute.post("/change", secureMiddleware, async (req, res) => {
    const  pokeId : number = parseInt(req.body.pokeId);
    const userId : ObjectId | undefined = req.session.user?._id;
    if (!userId) {
        return res.status(401).render("401");
    }

    await changeCurrentPokemon(pokeId, userId);
    res.redirect("/myPokemon");
});

export default myPokemonRoute;