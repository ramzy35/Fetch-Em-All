import express from "express";
import { pokedexUtility } from "../middleware/pokedexUtility";

const pokedexRoute = express.Router();

export interface Pokemon {
    name: string,
    id: number,
    front_image: string,
    types: string[],
}

pokedexRoute.get("/", pokedexUtility, async (req, res) => {
    res.render("pokedex");
});

export default pokedexRoute;