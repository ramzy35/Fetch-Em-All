import express from "express";
import { pokeNamesLocal } from "../middleware/locals";
import { getPokemonById } from "../database";
import * as pokeStats from "../pokemonStats";
import { WithId } from "mongodb";

const wtpRoute = express.Router();

async function rndmPoke() {
    const rndmId : number = Math.floor(Math.random()*151)+1
    return await getPokemonById(rndmId)
}

let poke : WithId<pokeStats.PokemonStats>[];

wtpRoute.get("/", pokeNamesLocal, async (req, res) => {
    res.locals.currentPage = "wtp"
    poke = await rndmPoke()
    res.render("wtp", {
        poke : poke[0],
    });
});

wtpRoute.post("/", pokeNamesLocal, async (req, res) => {

    res.locals.currentPage = "wtp"
    const guess = typeof req.body.guess === "string" ? req.body.guess : "";
    console.log("posting", poke, guess)
    const anwer = checkGuess(guess, poke[0].name, res.locals.pokemonNameList)
    res.render("wtp", {
        poke : poke[0],
    });
});

async function checkGuess(guess:string, correctPoke:string, pokeNameList:string[]) {
    const answer = {
        response : "",
        correct : false
    }

    if (pokeNameList.includes(guess.toLowerCase())) {
        if (guess.toLowerCase() === correctPoke) {
            answer.response = "Correct! You guessed the right pokemon.";
            answer.correct = true;
        } else {
            answer.response = "Incorrect, you guessed the wrong pokemon.";
            answer.correct = false;
        }
    } else {;
        answer.response = "You didn't guess a valid Pokemon, try again!"
        answer.correct = false;
    }
     
    return answer
}

export default wtpRoute;