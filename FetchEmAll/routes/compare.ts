import express from "express";
import { getPokemonStats } from "./pokemon";
import { Pokemon } from "./pokedex";

const compareRoute = express.Router();

compareRoute.get("/", async (req, res) => {

    const id1:number = typeof req.query.id1 === "string" ? parseInt(req.query.id1) : 1;
    const id2:number = typeof req.query.id2 === "string" ? parseInt(req.query.id2) : 2;
    // standard values for both id's incase no id is given

    const poke1:Pokemon = await getPokemonStats(id1);
    const poke2:Pokemon = await getPokemonStats(id2);
    
    res.locals.currentPage = "compare" 

    res.render("compare", {
        poke1,
        poke2
    });
});

export default compareRoute;