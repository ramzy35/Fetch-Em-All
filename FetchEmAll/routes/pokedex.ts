import express from "express";
import { pokeListLocal } from "../middleware/locals";

const pokedexRoute = express.Router();

pokedexRoute.post("/choose-starter", (req, res) => {
    const { starterId } = req.body;
    console.log("Starter chosen:", starterId);
    res.redirect("/pokedex?hasStarter=true");
});

pokedexRoute.get("/", pokeListLocal, async (req, res) => {
    res.locals.currentPage = "pokedex";
    const hasStarter = req.query.hasStarter === "true";
    res.render("pokedex", { hasStarter });
});

export default pokedexRoute;