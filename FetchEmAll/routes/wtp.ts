import express from "express";
import { pokeNamesLocal } from "../middleware/locals";
import { secureMiddleware } from "../middleware/secureMiddleware";
import { getPokemonById, levelPokemon } from "../database";
import { Pokemon } from "../interfaces";
import { ObjectId } from "mongodb";

const wtpRoute = express.Router();

async function rndmPoke():Promise<Pokemon> {
    const rndmId : number = Math.floor(Math.random()*151)+1
    return await getPokemonById(rndmId)
}

let poke : Pokemon;

wtpRoute.get("/", pokeNamesLocal, secureMiddleware, async (req, res) => {
    res.locals.currentPage = "wtp"
    poke = await rndmPoke()
    res.render("wtp", {
        poke : poke,
        answer : {
            response : "",
            correct : false
        }
    });
});

wtpRoute.post("/", pokeNamesLocal, secureMiddleware, async (req, res) => {

    res.locals.currentPage = "wtp"
    const guess = typeof req.body.guess === "string" ? req.body.guess : "";

    const answer = checkGuess(guess, poke.name, res.locals.pokemonNameList, res.locals.user._id)
    res.render("wtp", {
        poke : poke,
        answer : answer
    });
});

wtpRoute.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

function checkGuess(guess:string, correctPoke:string, pokeNameList:string[], userId : ObjectId):{response:string, correct:boolean} {
    const answer = {
        response : "",
        correct : false
    }

    if (pokeNameList.includes(guess.toLowerCase())) {
        if (guess.toLowerCase() === correctPoke) {
            answer.response = "Correct! Je hebt juist geraden.";
            answer.correct = true;
            levelPokemon(userId);
        } else {
            answer.response = "Incorrect, je hebt fout geraden. Probeer opnieuw!";
            answer.correct = false;
        }
    } else {;
        answer.response = "Je gaf geen echte pokemon in, Probeer opnieuw!"
        answer.correct = false;
    }
     
    return answer
}
export default wtpRoute;