import express from "express";

const signUpRoute = express.Router();

signUpRoute.get("/", async (req, res) => {
    res.locals.currentPage = "signUp" 
    res.render("signUp");
});

export default signUpRoute;