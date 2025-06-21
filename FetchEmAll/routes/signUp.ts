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
            return res.redirect("/signup?error=wachtwoorden+zijn+niet+gelijk");
        }
        validateEmail(email);
        validateUsername(username);
        validatePassword(password)
        await createUser(username, email, password);
        res.redirect("/signin");
    } catch (error: any){
        console.error("Signup error:", error.message);
        res.redirect("/signup?error=" + encodeURIComponent(error.message));
    }
});

function validateUsername(username : string) {
    if(username.length > 32) {
        throw new Error("Gebruikersnaam mag niet meer dan 32 tekens zijn.")
    } else if(username.length < 4) {
        throw new Error("Gebruikersnaam moet minstens 4 tekens zijn")
    }
    return;
}

function validateEmail(email : string) {
    const emailPattern : RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailPattern.test(email)) {
        throw new Error("Geen geldig email-adres!")
    } 
    return;

}

function validatePassword(password : string) {
    const pattern : RegExp = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$");
    if(password.length < 8) {
        throw new Error("Wachtwoord moet minstens 8 tekens lang zijn")
    } else if(!pattern.test(password)) {
        throw new Error("Wachtwoord moet een hoofdletter, kleine letter en cijfer bevatten.")
    }
    return;
}

signUpRoute.get("/:status", async (_req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default signUpRoute;