import express from "express";
import { getPokemonList } from "../middleware/getPokemonList";
import { Pokemon } from "./pokedex";

const signInRoute = express.Router();

signInRoute.get("/", async (req, res) => {
    res.locals.currentPage = "signUn" 
    res.render("signIn");
});

export default signInRoute;