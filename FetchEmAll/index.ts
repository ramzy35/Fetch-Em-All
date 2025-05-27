import express from "express";
import dotenv from "dotenv";

import pokedexRoute from "./routes/pokedex";
import wtpRoute from "./routes/wtp";
import pokemonRoute from "./routes/pokemon";
import compareRoute from "./routes/compare";
import myPokemonRoute from "./routes/myPokemon";
import battleRoute from "./routes/battle";
import landingRoute from "./routes/landing";
import signInRoute from "./routes/signIn";
import signUpRoute from "./routes/signUp";

import { connect } from "./database";
import { formattingLocals } from "./middleware/locals";
import session from "./session";

dotenv.config();

const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("port", process.env.PORT);

app.use(formattingLocals);
app.use(session);


app.use("/pokedex", pokedexRoute);
app.use("/wtp", wtpRoute);
app.use("/compare", compareRoute);
app.use("/pokemon", pokemonRoute);
app.use("/myPokemon", myPokemonRoute);
app.use("/", landingRoute);
app.use("/signin", signInRoute);
app.use("/signup", signUpRoute);
app.use("/battle", battleRoute);    

app.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

app.listen(app.get("port"), async() => {
    await connect()
    console.log("🚀 Server started on port" + app.get("port"));
});