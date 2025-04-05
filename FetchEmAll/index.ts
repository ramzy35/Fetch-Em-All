import express from "express";
import pokedexRoute from "./routes/pokedex";
import { getPokemonList } from "./middleware/getPokemonList";

const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("port", 3000);

app.use(getPokemonList)

app.use("/pokedex", pokedexRoute);

app.listen(app.get("port"), () => {
    console.log("Server started on http://localhost:" + app.get("port"));
});