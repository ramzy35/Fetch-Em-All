import express from "express";
import { Pokemon } from "./pokedex";

const wtpRoute = express.Router();

function rndmPokeId() {
    return Math.floor(Math.random()*151)+1
}

let names : string[];

wtpRoute.get("/", async (req, res) => {

    res.render("wtp", {
        rndmPokeId
    });
});





export default wtpRoute;