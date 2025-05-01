import express from "express";

const landingRoute = express.Router();

landingRoute.get("/", async (req, res) => {
    res.locals.currentPage = "landing" 
    res.render("landing");
});

export default landingRoute;