import express from "express";
import { pokeListLocal } from "../middleware/locals";

const pokedexRoute = express.Router();

pokedexRoute.get("/", pokeListLocal, async (req, res) => {
    res.locals.currentPage = "pokedex" 
    res.render("pokedex");
});

export default pokedexRoute;