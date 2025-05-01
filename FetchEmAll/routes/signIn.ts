import express from "express";

const signInRoute = express.Router();

signInRoute.get("/", async (req, res) => {
    res.locals.currentPage = "signUn" 
    res.render("signIn");
});

export default signInRoute;