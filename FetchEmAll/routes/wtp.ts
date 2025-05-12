import express from "express";
import { pokeNamesLocal } from "../middleware/locals";
import { secureMiddleware } from "../middleware/secureMiddleware";
import { getPokemonById } from "../database";
import { Pokemon } from "../interfaces";

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

wtpRoute.post("/", pokeNamesLocal, async (req, res) => {

    res.locals.currentPage = "wtp"
    const guess = typeof req.body.guess === "string" ? req.body.guess : "";

    const answer = checkGuess(guess, poke.name, res.locals.pokemonNameList)
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

function checkGuess(guess:string, correctPoke:string, pokeNameList:string[]):{response:string, correct:boolean} {
    const answer = {
        response : "",
        correct : false
    }

    if (pokeNameList.includes(guess.toLowerCase())) {
        if (guess.toLowerCase() === correctPoke) {
            answer.response = "Correct! You guessed the right pokemon.";
            answer.correct = true;
            giveEXP();
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

function giveEXP() {
    // currentPokemon.exp = currenPokemon.exp + (1 * expScaling);
    
}

export default wtpRoute;