import express from "express";
import { Pokemon } from "./pokedex";

const battleRoute = express.Router();

battleRoute.get("/", (req, res) => {
    res.render("battle");
});

export default battleRoute;