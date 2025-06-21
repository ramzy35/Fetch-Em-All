import { Request, Response, NextFunction} from "express";
import { getMyPokemon, getAllPokemon, getPokemonById, healPokemon } from "../database";
import { FullPokemon, Pokemon } from "../interfaces";

/**
 * Middleware paramaters:
 * 
 * @param req The Express Request object containing data kept between pages
 * @param res The Express Response object containing data sent to the next page
 * @param next The Express Nextfunction that calls the next middleware function
 * 
 * An underscore "_" before any of the paramaters means that this parameter is unused in the function
 */

/**
 * Middleware to attach a list of all Pokémon names to `res.locals`.
 *
 * Fetches the complete list of Pokémon using `getAllPokemon`, extracts each name,
 * and stores them in `res.locals.pokemonNameList` for use in downstream middleware
 * or route handlers.
 */
export async function pokeNamesLocal(_req:Request, res:Response, next:NextFunction){
    const pokeList : Pokemon[]  = await getAllPokemon()
    res.locals.pokemonNameList = [];
    pokeList.forEach(poke => {
        res.locals.pokemonNameList.push(poke?.name) 
    });
    next();
}

/**
 * Middleware to attach the user's owned Pokémon to `res.locals`.
 *
 * Retrieves the currently logged-in user from the session and stores it in `res.locals.user`.
 * Initiates healing for all Pokémon owned by the user, fetches the full list of their Pokémon,
 * and sorts them so the current/active Pokémon (if any) appear first in the array.
 * The sorted list is stored in `res.locals.myPokemon` for use in downstream middleware or routes.
 */
export async function myPokemonLocal(_req:Request, res:Response, next:NextFunction){
    await healPokemon(res.locals.user._id)
    const myPokemon : FullPokemon[] = await getMyPokemon(res.locals.user._id);
    myPokemon.sort((a,b) => (b.currentPokemon ? 1 : 0) - (a.currentPokemon ? 1 : 0));
    res.locals.myPokemon = myPokemon;

    next();
}

/**
 * Middleware to attach both the full list of Pokémon and the user's owned Pokémon IDs to `res.locals`.
 */
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

/**
 * Middleware that registers various formatting and styling helper functions to `res.locals`.
 *
 * These helpers are intended for use in templates or frontend logic and include formatting for
 * Pokémon types, stat bars, generations, IDs, and conditional styling.
 *
 * Registered functions:
 *
 * - `getTypes(types: string[]): string`: Joins an array of types into a comma-separated string.
 * - `convert(num: number): number`: Converts a decimetre value to metres (e.g., for height or weight).
 * - `generation(gen: string): string`: Maps generation API strings (e.g., "generation-ii") to Roman numerals.
 * - `formatId(id: number): string`: Formats a Pokémon ID as a 3-digit string with a `#` prefix (e.g., `#025`).
 * - `getPercentAndColor(currentHp: number, maxHp: number): string`: Returns an inline style string representing HP bar width and color.
 * - `getPercent(stat: number, statMax: number): string`: Returns a style string for width percentage of a stat bar.
 * - `getCompareStyling(stat1: number, stat2: number, statMax: number): string`: Returns a style string for comparative stat bar with color coding.
 *
 */
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

/**
 * Middleware to determine whether the current user owns at least one Pokémon (starter or otherwise).
 *
 * Checks the session for a logged-in user and uses their ID to fetch owned Pokémon via `getMyPokemon`.
 * Sets `res.locals.hasStarter` to `true` if the user owns any Pokémon, or `false` otherwise.
 * This flag can be used in views or routes to control access or display logic (e.g., onboarding).
 */
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