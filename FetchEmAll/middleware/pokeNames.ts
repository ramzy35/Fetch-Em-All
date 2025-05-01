import { Request, Response, NextFunction} from "express";
import { getAllPokemon } from "../database";

export async function pokeNamesLocal(req:Request, res:Response, next:NextFunction){
    const pokeList = await getAllPokemon()
    res.locals.pokemonNameList = [];
    // site crashes when this line is not here, looking into this later
    pokeList.forEach(poke => {
        res.locals.pokemonNameList.push(poke?.name) 
    });
    next();
}