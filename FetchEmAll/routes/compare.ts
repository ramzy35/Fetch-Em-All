import express from "express";
import { Pokemon } from "./pokedex";

const compareRoute = express.Router();

compareRoute.get("/", async (req, res) => {

    const id1:number = typeof req.query.id1 === "string" ? parseInt(req.query.id1) : 1;
    const id2:number = typeof req.query.id2 === "string" ? parseInt(req.query.id2) : 2;

    res.render("compare", {
        id1,
        id2
    });
});

export default compareRoute;