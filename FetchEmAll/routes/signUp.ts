import express from "express";
import { getPokemonList } from "../middleware/getPokemonList";
import { Pokemon } from "./pokedex";

const signUpRoute = express.Router();

signUpRoute.get("/", async (req, res) => {
    res.locals.currentPage = "signUp" 
    res.render("signUp");
});

export default signUpRoute;