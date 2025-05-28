import { NextFunction, Request, Response } from "express";

/**
 * Middleware to enforce authentication by checking for a valid user session.
 *
 * If a valid session with a user ID exists, the user object is attached to `res.locals.user`
 * and the request proceeds to the next middleware or route handler. If no valid session is found,
 * the user is redirected to the homepage (`/`), effectively blocking access to protected routes.
 *
 * @param req - The Express Request object containing the session.
 * @param res - The Express Response object used for redirecting or passing user data.
 * @param next - The next middleware function in the stack.
 */
export function secureMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.user && typeof req.session.user != "undefined" && typeof req.session.user._id != "undefined") {
        res.locals.user = req.session.user;
        next();
    } else {
        res.redirect("/");
    }
};