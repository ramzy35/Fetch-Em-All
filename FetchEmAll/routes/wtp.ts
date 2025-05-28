import express from "express";
import { pokeNamesLocal } from "../middleware/locals";
import { secureMiddleware } from "../middleware/secureMiddleware";
import { getPokemonById, levelPokemon } from "../database";
import { Pokemon } from "../interfaces";
import { ObjectId } from "mongodb";

const wtpRoute = express.Router();

/**
 * Returns a randomly selected Pokémon from the first generation (Kanto region).
 *
 * Generates a random integer between 1 and 151 and uses it to fetch a Pokémon
 * by its ID via the `getPokemonById` function. This includes only the original
 * 151 Pokémon (Gen I).
 *
 * @returns A Promise that resolves to a `Pokemon` object corresponding to the randomly selected ID.
 */
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

/**
 * Checks a user's guessed Pokémon name against the correct answer.
 *
 * - Verifies if the guess exists in the full Pokémon name list.
 * - If valid, checks if it matches the correct Pokémon name (case-insensitive).
 * - If the guess is correct, triggers `levelPokemon` to level up the user's Pokémon.
 * - Returns a response message and correctness flag.
 *
 * @param guess - The name guessed by the user.
 * @param correctPoke - The correct Pokémon name (expected in lowercase).
 * @param pokeNameList - A list of all valid Pokémon names (in lowercase).
 * @param userId - The ObjectId of the user making the guess (used for leveling).
 * @returns An object containing a response message and a boolean indicating correctness.
 */
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

/**
 * ============================================================================
 *  ⚙️  Documentation Notice
 * ============================================================================
 *
 * This file's inline documentation was initially generated with the help of AI.
 * All comments and descriptions have been carefully reviewed and proofread by
 * the developer to ensure accuracy and clarity.
 *
 * ============================================================================
 */