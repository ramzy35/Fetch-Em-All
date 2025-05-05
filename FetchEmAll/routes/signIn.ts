import express from "express";

const signInRoute = express.Router();

signInRoute.get("/", async (req, res) => {
    res.locals.currentPage = "signUn" 
    res.render("signIn");
});

signInRoute.post("/", async (req, res) => {
    
    res.redirect("pokedex")
})

export default signInRoute;