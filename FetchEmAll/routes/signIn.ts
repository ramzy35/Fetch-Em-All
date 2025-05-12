import express from "express";
import { login } from "../database";
import { User } from "../interfaces";

const signInRoute = express.Router();

signInRoute.get("/", async (req, res) => {
    res.locals.currentPage = "signIn";
    const error = req.query.error as string | undefined;
    res.render("signIn", { error });
});

signInRoute.post("/", async (req, res) => {
    const username : string = req.body.username;
    const password : string = req.body.password;
    try {
        let user : User = await login(username, password);
        delete user.password;
        req.session.user = user;
        res.redirect("/");
    } catch (error: any) {
        console.log("Signin error:", error.message);
        res.redirect("/signin?error=" + encodeURIComponent(error.message));
    }
});

signInRoute.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default signInRoute;