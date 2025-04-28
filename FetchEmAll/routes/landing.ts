import express from "express";
import { getPokemonList } from "../middleware/getPokemonList";
import { Pokemon } from "./pokedex";

const landingRoute = express.Router();

landingRoute.get("/", async (req, res) => {
    res.locals.currentPage = "landing" 
    res.render("landing");
});

export default landingRoute;