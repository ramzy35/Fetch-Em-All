import { NextFunction, Request, Response } from "express";

export function secureMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.user && typeof req.session.user != "undefined" && typeof req.session.user._id != "undefined") {
        res.locals.user = req.session.user;
        next();
    } else {
        res.redirect("/");
    }
};