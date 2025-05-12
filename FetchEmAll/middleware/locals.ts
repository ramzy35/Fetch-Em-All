import { Request, Response, NextFunction} from "express";
import { getMyPokemon, getAllPokemon, getPokemonById } from "../database";
import { FullPokemon, MyPokemon, Pokemon } from "../interfaces";
import { ObjectId } from "mongodb";

export async function pokeNamesLocal(_req:Request, res:Response, next:NextFunction){
    const pokeList : Pokemon[]  = await getAllPokemon()
    res.locals.pokemonNameList = [];
    // site crashes when this line is not here, looking into this later
    pokeList.forEach(poke => {
        res.locals.pokemonNameList.push(poke?.name) 
    });
    next();
}

export async function myPokemonLocal(req:Request, res:Response, next:NextFunction){
    if (req.session.user && typeof req.session.user != "undefined" && typeof req.session.user._id != "undefined") {
        res.locals.user = req.session.user;
    } else {
        res.redirect("/login");
    }
    const myPokemon : FullPokemon[] = await getMyPokemon(res.locals.user._id)
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

export async function hasStarterLocal(req: Request, res: Response, next: NextFunction) {
    const ownerId = req.session.user?._id;
    if (ownerId) {
        const myPoke: FullPokemon[] = await getMyPokemon(ownerId);
        res.locals.hasStarter = myPoke.length > 0;
    } else {
        res.locals.hasStarter = false;
    }
    next();
}