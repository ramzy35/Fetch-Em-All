import { link } from "./database";
import session from "express-session";
import { User } from "./interfaces";
import mongoDbSession from "connect-mongodb-session";

/**
 * ============================================================================
 *  ⚙️  Documentation Notice
 * ============================================================================
 *
 * This file's inline documentation was initially generated with the help of AI.
 * All comments and descriptions have been carefully reviewed and edited by
 * the developer to ensure accuracy and clarity.
 *
 * ============================================================================
 */

const MongoDBStore = mongoDbSession(session);

const mongoStore = new MongoDBStore({
    uri: link,                      // mongodb uri
    collection: "sessions",         // collection in db
    databaseName: "FetchEmAll",     // database name
});

/**
 * Extend express-session's SessionData interface
 * to include optional `user` property of type User.
 */
declare module 'express-session' {
    export interface SessionData {
        user?: User
    }
}

/**
 * Export the configured session middleware.
 * 
 * Configuration:
 * - secret: session secret key (from environment or fallback)
 * - store: MongoDB-backed session store
 * - resave: forces session to be saved back to store even if not modified
 * - saveUninitialized: save uninitialized sessions
 * - cookie: session cookie settings (7 days expiry)
 */
export default session({
    secret: process.env.SESSION_SECRET ?? "my-super-secret-secret",
    store: mongoStore,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
});