import express from "express";
import { getPokemonById } from "../database";
import { pokeNamesLocal } from "../middleware/locals";
import { Pokemon } from "../interfaces";
import { secureMiddleware } from "../middleware/secureMiddleware";

const compareRoute = express.Router();

compareRoute.get("/", pokeNamesLocal, secureMiddleware, async (req, res) => {

    const id1:number = typeof req.query.id1 === "string" ? parseInt(req.query.id1) : 1;
    const id2:number = typeof req.query.id2 === "string" ? parseInt(req.query.id2) : 2;

    const poke1 : Pokemon = await getPokemonById(id1);
    const poke2 : Pokemon = await getPokemonById(id2);
    
    res.locals.currentPage = "compare" 

    res.render("compare", {
        poke1,
        poke2
    });
});

compareRoute.get("/:status", async (_req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default compareRoute;