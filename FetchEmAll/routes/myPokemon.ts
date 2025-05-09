import express from "express";
import { getCurrentPokemon, getMyPokemon, getUserById } from "../database";
import { myPokemonLocal } from "../middleware/locals";

const myPokemonRoute = express.Router();

myPokemonRoute.get("/",myPokemonLocal, async (req, res) => {
    res.locals.currentPokemon =  await getCurrentPokemon(1)
    res.locals.currentPage = "myPokemon" 
    res.render("myPokemon");
});

export default myPokemonRoute;