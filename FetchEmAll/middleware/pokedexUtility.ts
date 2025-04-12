import { Request, Response, NextFunction} from "express";

export function pokedexUtility(req: Request, res: Response, next: NextFunction) {
    res.locals.getTypes = (types: string[]) => {
        return types.join(", ");
    }
    res.locals.convert = (num: number) => {
        return num/10;
    }
    next();
}