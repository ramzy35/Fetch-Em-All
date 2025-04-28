import express from "express";
import pokedexRoute from "./routes/pokedex";
import wtpRoute from "./routes/wtp";
import pokemonRoute from "./routes/pokemon";
import compareRoute from "./routes/compare";
import myPokemonRoute from "./routes/myPokemon";
import landingRoute from "./routes/landing";
import signInRoute from "./routes/signIn";
import signUpRoute from "./routes/signUp";
import battleRoute from "./routes/battle";
import { getPokemonList } from "./middleware/getPokemonList";
import { pokedexUtility } from "./middleware/pokedexUtility";

const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("port", 3000);

app.use(getPokemonList);
app.use(pokedexUtility);

app.use("/pokedex", pokedexRoute);
app.use("/wtp", wtpRoute);
app.use("/compare", compareRoute);
app.use("/pokemon", pokemonRoute);
app.use("/myPokemon", myPokemonRoute);
app.use("/landing", landingRoute);
app.use("/signin", signInRoute);
app.use("/signup", signUpRoute);
app.use("/battle", battleRoute);    

app.listen(app.get("port"), () => {
    console.log("Server started on http://localhost:" + app.get("port"));
});