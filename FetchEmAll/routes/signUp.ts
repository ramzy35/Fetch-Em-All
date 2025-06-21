import express from "express";
import { createUser } from "../database";

const signUpRoute = express.Router();

signUpRoute.get("/", async (req, res) => {
    res.locals.currentPage = "signUp";
    const error = req.query.error as string | undefined;
    res.render("signUp", { error });
});

signUpRoute.post("/", async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    try {
        if (!username || !email || !password || !confirmPassword) {
            return res.redirect("/signup?error=missing-fields");
        }
        if (password !== confirmPassword) {
            return res.redirect("/signup?error=passwords+do+not+match");
        }
        await createUser(username, email, password);
        res.redirect("/signin");
    } catch (error: any){
        console.error("Signup error:", error.message);
        res.redirect("/signup?error=" + encodeURIComponent(error.message));
    }
});

signUpRoute.get("/:status", async (_req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default signUpRoute;