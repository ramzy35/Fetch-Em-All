import express from "express";
import { login } from "../database";
import { User } from "../interfaces";

const signInRoute = express.Router();

signInRoute.get("/", async (req, res) => {
    res.locals.currentPage = "signIn" 
    res.render("signIn");
});

signInRoute.post("/signin", async (req, res) => {
    const username : string = req.body.username;
    const password : string = req.body.password;
    try {
        let user : User = await login(username, password);
        delete user.password;
        req.session.user = user;
        res.redirect("/");
    } catch (e: any) {
        res.redirect("/signin");
    }
});

export default signInRoute;