import express from "express";
import { myPokemonLocal } from "../middleware/locals";

const myPokemonRoute = express.Router();

myPokemonRoute.get("/",myPokemonLocal, async (req, res) => {
    res.locals.currentPokemon = 2
    res.locals.currentPage = "myPokemon" 
    res.render("myPokemon");
});

export default myPokemonRoute;