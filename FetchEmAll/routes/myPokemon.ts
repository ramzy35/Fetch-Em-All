import express from "express";
import { getCurrentPokemon, getUserById } from "../database";
import { myPokemonLocal } from "../middleware/locals";
import { secureMiddleware } from "../middleware/secureMiddleware";

const myPokemonRoute = express.Router();

myPokemonRoute.get("/", myPokemonLocal, secureMiddleware, async (req, res) => {
    res.locals.currentPokemon =  await getCurrentPokemon(res.locals.user._id)
    res.locals.currentPage = "myPokemon" 
    res.render("myPokemon");
});

myPokemonRoute.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default myPokemonRoute;