import express from "express";

const landingRoute = express.Router();

landingRoute.get("/", async (req, res) => {
    res.locals.currentPage = "landing";
    res.render("landing", {user: req.session.user});
});

landingRoute.post("/logout", async (req, res) => {
    req.session.destroy(() => {
        console.log("🗑️  destroyed session")
        res.redirect("/");
    });
});

export default landingRoute;