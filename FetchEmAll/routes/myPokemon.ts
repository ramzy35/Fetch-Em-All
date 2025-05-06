import express from "express";
import { getMyPokemon, getUserById } from "../database";
import { myPokemonLocal } from "../middleware/locals";

const myPokemonRoute = express.Router();

myPokemonRoute.get("/",myPokemonLocal, async (req, res) => {
    const user = await getUserById(1)
    res.locals.currentPokemon =  user[0].currentPokemon
    res.locals.currentPage = "myPokemon" 
    res.render("myPokemon");
});

export default myPokemonRoute;