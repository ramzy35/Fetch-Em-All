import express from "express";
import { pokeNamesLocal } from "../middleware/locals";
import { getPokemonById } from "../database";
import { PokemonStats } from "../pokemonStats";

const wtpRoute = express.Router();

async function rndmPoke():Promise<PokemonStats[]> {
    const rndmId : number = Math.floor(Math.random()*151)+1
    return await getPokemonById(rndmId)
}

let poke : PokemonStats[];

wtpRoute.get("/", pokeNamesLocal, async (req, res) => {
    res.locals.currentPage = "wtp"
    poke = await rndmPoke()
    res.render("wtp", {
        poke : poke[0],
        answer : {
            response : "",
            correct : false
        }
    });
});

wtpRoute.post("/", pokeNamesLocal, async (req, res) => {

    res.locals.currentPage = "wtp"
    const guess = typeof req.body.guess === "string" ? req.body.guess : "";

    const answer = checkGuess(guess, poke[0].name, res.locals.pokemonNameList)
    res.render("wtp", {
        poke : poke[0],
        answer : answer
    });
});

function checkGuess(guess:string, correctPoke:string, pokeNameList:string[]):{response:string, correct:boolean} {
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