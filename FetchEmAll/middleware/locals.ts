import { Request, Response, NextFunction} from "express";
import { getMyPokemon, getAllPokemon, getPokemonById } from "../database";
import { FullPokemon, MyPokemon, Pokemon } from "../interfaces";
import { ObjectId } from "mongodb";

// Array of plain text pokemon names
export async function pokeNamesLocal(_req:Request, res:Response, next:NextFunction){
    const pokeList : Pokemon[]  = await getAllPokemon()
    res.locals.pokemonNameList = [];
    // site crashes when this line is not here, looking into this later
    pokeList.forEach(poke => {
        res.locals.pokemonNameList.push(poke?.name) 
    });
    next();
}

// Array of pokemon owned by user
export async function myPokemonLocal(req:Request, res:Response, next:NextFunction){
    res.locals.user = req.session.user;
    const myPokemon : FullPokemon[] = await getMyPokemon(res.locals.user._id);

    myPokemon.sort((a,b) => (b.currentPokemon ? 1 : 0) - (a.currentPokemon ? 1 : 0));
    res.locals.myPokemon = myPokemon;

    next();
}

// All owned pokemon ids and all pokemon
export async function pokeListLocal(req: Request, res: Response, next: NextFunction) {
    if (req.session.user && typeof req.session.user != "undefined" && typeof req.session.user._id != "undefined") {
        const myPokemon : FullPokemon[] = await getMyPokemon(req.session.user._id)
        const idList : number[] = myPokemon.map((poke) => {
            return poke.id
        })
        res.locals.myPokeIds = idList;
    }

    const pokeList: Pokemon[] = await getAllPokemon()
    res.locals.pokemonList = pokeList
    next();
}

// Various formatting and styling functions
export async function formattingLocals(_req: Request, res: Response, next: NextFunction) {
    res.locals.getTypes = (types: string[]) : string => {
        return types.join(", ");
    }

    res.locals.convert = (num: number) : number => {
        return num/10;
    }

    res.locals.generation = (gen: string) : string => {
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

    res.locals.formatId = (id : number) : string => {
        const idString : string = "000" + id.toString()
        return `#${idString.slice(-3)}`
    }

    res.locals.getPercentAndColor = (currentHp: number, maxHp: number): string => {
        const percent = currentHp / maxHp;
        let color: string;

        if (percent >= 0.7) {
            color = "#008000"; // Green
        } else if (percent >= 0.3) {
            color = "#ffff00"; // Yellow
        } else {
            color = "#ff0000"; // Red
        }
        return `"width: calc(100% * ${percent}); background-color: ${color}"`;
    };

    res.locals.getPercent = (stat: number, statMax: number): string => {
        return `"width: calc(100% * ${stat} / ${statMax});"`;
    };

    res.locals.getCompareStyling = (stat1: number, stat2: number, statMax : number): string => {
        const percent = stat1 / statMax;
        let color:string;
        if(stat1 > stat2) {
            color = "#008000";
        } else if(stat1 === stat2) {
            color = "#ffff00";
        } else {
            color = "#ff0000";
        }
        return `"width: calc(100% * ${percent}); background-color: ${color}"`;
    };

    next();
}

// Check if user has starter Pokemon
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