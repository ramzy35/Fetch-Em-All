import express from "express";
import { getCurrentPokemon, getUserById } from "../database";
import { myPokemonLocal } from "../middleware/locals";
import { secureMiddleware } from "../middleware/secureMiddleware";

const myPokemonRoute = express.Router();

myPokemonRoute.get("/", myPokemonLocal, async (req, res) => {
    res.locals.currentPokemon =  await getCurrentPokemon(res.locals.user._id)
    res.locals.currentPage = "myPokemon" 
    res.render("myPokemon");
});

export default myPokemonRoute;