import { Request, Response, NextFunction} from "express";

export function pokedexUtility(req: Request, res: Response, next: NextFunction) {
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
    next();
}