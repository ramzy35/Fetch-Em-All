import express from "express";
import { pokeListLocal } from "../middleware/locals";

const pokedexRoute = express.Router();

export interface Pokemon {
    name: string,
    id: number,
    front_image: string,
    types: string[],
}

pokedexRoute.get("/", pokeListLocal, async (req, res) => {
    res.locals.currentPage = "pokedex" 
    res.render("pokedex");
});

export default pokedexRoute;