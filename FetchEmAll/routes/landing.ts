import express from "express";

const landingRoute = express.Router();

landingRoute.get("/", async (req, res) => {
    res.locals.currentPage = "landing";
    res.render("landing", {user: req.session.user});
});

landingRoute.post("/logout", async (req, res) => {
    req.session.destroy(() => {
        console.log("👋 Logged out");
        res.redirect("/");
    });
});

landingRoute.get("/logout/:status", async (_req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default landingRoute;