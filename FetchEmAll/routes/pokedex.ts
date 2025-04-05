import express from "express";

const pokedexRoute = express.Router();

export interface Pokemon {
    name: string,
    id: number,
    front_image: string,
    types: string[],
}

pokedexRoute.get("/", async (req, res) => {
    res.render("pokedex");
});

export default pokedexRoute;