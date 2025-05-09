import { Request, Response, NextFunction} from "express";
import { getAllPokemon, getMyPokemon, getPokemonById } from "../database";
import { MyPokemon, Pokemon } from "../interfaces";

export async function pokeNamesLocal(_req:Request, res:Response, next:NextFunction){
    const pokeList : Pokemon[]  = await getAllPokemon()
    res.locals.pokemonNameList = [];
    // site crashes when this line is not here, looking into this later
    pokeList.forEach(poke => {
        res.locals.pokemonNameList.push(poke?.name) 
    });
    next();
}

export async function myPokemonLocal(_req:Request, res:Response, next:NextFunction){
    const myPokemon : Pokemon[] = await getMyPokemon(1)
    res.locals.myPokemon = myPokemon;
    next();
}

export async function pokeListLocal(_req: Request, res: Response, next: NextFunction) {
    const pokeList: Pokemon[] = await getAllPokemon()
    res.locals.pokemonList = pokeList
    next();
}

export async function formattingLocals(_req: Request, res: Response, next: NextFunction) {
    res.locals.getTypes = (types: string[]) => {
        return types.join(", ");
    }
    res.locals.convert = (num: number) => {
        return num/10;
    }
    res.locals.generation = (gen: string) => {
        const map: Record<string, string> = {
            "generation-i": "I",
            "generation-ii": "II",
            "generation-iii": "III",
            "generation-iv": "IV",
            "generation-v": "V",
            "generation-vi": "VI",
            "generation-vii": "VII",
            "generation-viii": "VIII"
        };
        return map[gen] || gen;
    };
    res.locals.formatId = (id : number) => {
        const idString : string = "000" + id.toString()
        return `#${idString.slice(-3)}`
    }
    next();
}