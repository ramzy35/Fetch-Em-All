import express from "express";
import { getPokemonStats } from "./pokemon";
import { Pokemon } from "./pokedex";

const compareRoute = express.Router();

compareRoute.get("/", async (req, res) => {

    const id1:number = typeof req.query.id1 === "string" ? parseInt(req.query.id1) : 1;
    const id2:number = typeof req.query.id2 === "string" ? parseInt(req.query.id2) : 2;

    const poke1 = await getPokemonStats(id1);
    const poke2 = await getPokemonStats(id2);

    res.render("compare", {
        poke1,
        poke2
    });
});

export default compareRoute;