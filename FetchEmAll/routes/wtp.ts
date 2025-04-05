import express from "express";

const wtpRoute = express.Router();

wtpRoute.get("/", async (req, res) => {
    res.render("wtp");
});

export default wtpRoute;