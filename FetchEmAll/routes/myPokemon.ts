import express from "express";
import { catchPokemon, changeCurrentPokemon, getCurrentPokemon, getUserById } from "../database";
import { myPokemonLocal } from "../middleware/locals";
import { secureMiddleware } from "../middleware/secureMiddleware";

const myPokemonRoute = express.Router();

myPokemonRoute.get("/", myPokemonLocal, secureMiddleware, async (req, res) => {
    res.locals.currentPokemon =  await getCurrentPokemon(res.locals.user._id);
    res.locals.currentPage = "myPokemon";
    // to test curr bullshit
    // await catchPokemon(9, res.locals.user._id, 20); 
    res.render("myPokemon");
});

myPokemonRoute.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
});

myPokemonRoute.post("/change", async (req, res) => {
    const { pokeId } = req.body;
    const userId = req.session.user?._id;
    if (!userId) {
        return res.status(401).render("401");
    }

    await changeCurrentPokemon(Number(pokeId), userId);
    res.redirect("/myPokemon"); // Redirect back to the list
});

export default myPokemonRoute;