import express from "express";
import { getPokemonById } from "../database";
import { pokeNamesLocal } from "../middleware/locals";
import { Pokemon } from "../interfaces";

const compareRoute = express.Router();

compareRoute.get("/", pokeNamesLocal, async (req, res) => {

    const id1:number = typeof req.query.id1 === "string" ? parseInt(req.query.id1) : 1;
    const id2:number = typeof req.query.id2 === "string" ? parseInt(req.query.id2) : 2;
    // standard values for both id's incase no id is given

    const poke1 : Pokemon[] = await getPokemonById(id1);
    const poke2 : Pokemon[] = await getPokemonById(id2);
    
    res.locals.currentPage = "compare" 

    res.render("compare", {
        poke1 : poke1[0],
        poke2 : poke2[0]
    });
});

export default compareRoute;