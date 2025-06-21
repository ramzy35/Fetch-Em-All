import { Collection, MongoClient, ObjectId } from "mongodb";
import { getPokemonList } from "./middleware/fetchPokemon";
import { FullPokemon, MyPokemon, Pokemon, User } from "./interfaces";
import dotenv from "dotenv"
import bcrypt from "bcrypt"

/**
 * ============================================================================
 *  ⚙️  Documentation Notice
 * ============================================================================
 *
 * This file's inline documentation was initially generated with the help of AI.
 * All comments and descriptions have been carefully reviewed and proofread by
 * the developer to ensure accuracy and clarity.
 *
 * ============================================================================
 */

dotenv.config();
export const link = process.env.MONGO_URI || ""
const client = new MongoClient(link);

const saltRounds : number = 10;

const pokedexCollection     : Collection<Pokemon> = client.db("FetchEmAll").collection<Pokemon>("pokedex");
const userCollection        : Collection<User> = client.db("FetchEmAll").collection<User>("users");
const myPokemonCollection   : Collection<MyPokemon> = client.db("FetchEmAll").collection<MyPokemon>("mypokemon");

/////////////
// POKEMON //
/////////////

/**
 * Retrieves all Pokémon from the pokedexCollection in the database,
 * sorted by their ID in ascending order.
 * 
 * @returns A promise that resolves to an array of Pokémon objects.
 *          Returns an empty array if there is an error during retrieval.
 */
export async function getAllPokemon():Promise<Pokemon[]> {
    try {
        const allPokemon:Pokemon[] = (await pokedexCollection.find({}).sort({ id : 1 }).toArray());
        return allPokemon;
    } catch (error) {
        console.error(error)
    }
    return [];
}

/**
 * Retrieves a single Pokémon from the database by its ID.
 * 
 * @param id - The ID of the Pokémon to retrieve.
 * @returns A promise that resolves to the Pokémon object.
 * @throws An error if no Pokémon with the given ID is found or if the retrieval fails.
 */
export async function getPokemonById(id:number):Promise<Pokemon> {
    try {
        const pokemon:Pokemon | null = await pokedexCollection.findOne({ id : id });
        if(pokemon){
            return pokemon
        } else {
            throw new Error(`Failed to get Pokemon with id ${id} from database`);
        }
    } catch (error) {
        console.error(error)
    }
    throw new Error(`Failed to get Pokemon with id ${id} from database`);
}

//////////////////
// FULL POKEMON //
//////////////////

/**
 * Calculates a scaled stat value based on the Pokémon's base stat and level.
 * 
 * @param base - The base stat value of the Pokémon.
 * @param level - The current level of the Pokémon.
 * @returns The scaled stat value, rounded up to the nearest integer.
 */
function scaleStat(stats : number[], level: number): number[] {
    stats.forEach(stat => {
        stat = Math.ceil(stat + (level - 1) * stat / 50);
    });
    return stats
}

/**
 * Creates a FullPokemon object by retrieving base Pokémon data and scaling stats
 * according to the given level. Initializes additional fields required for a user's Pokémon.
 * 
 * @param pokeId - The ID of the base Pokémon to retrieve.
 * @param pokeLevel - The level to scale the Pokémon's stats to.
 * @returns A promise that resolves to a FullPokemon object with scaled stats and initialized properties.
 */
export async function createFullPokemon(pokeId : number, pokeLevel : number):Promise<FullPokemon> {
    const basePoke:Pokemon = await getPokemonById(pokeId)
    let fullPoke : FullPokemon = {
        ...basePoke,
        currentHp: Math.ceil(basePoke.hp + 1/50 * (pokeLevel - 1) * basePoke.hp),
        isFainted: false,
        level: pokeLevel,
        currentPokemon: false,
        nickname: basePoke.name,
        lastHealed : new Date()
    }

    const scaledStats : number[] = scaleStat([basePoke.hp, basePoke.attack, basePoke.speed, basePoke.defense], pokeLevel)
    fullPoke.hp        = scaledStats[0]
    fullPoke.attack    = scaledStats[1]
    fullPoke.speed     = scaledStats[2]
    fullPoke.defense   = scaledStats[3]

    return fullPoke
}

/**
 * Levels up the current Pokémon of the specified user by 1 level.
 * Increases the Pokémon's stats proportionally based on its base stats.
 * Does nothing if the Pokémon is already at level 100.
 * 
 * @param userId - The ObjectId of the user whose current Pokémon will be leveled up.
 * @returns A promise that resolves when the Pokémon's stats and level are updated in the database.
 */
export async function levelPokemon(userId : ObjectId) {
    const currentPoke:FullPokemon = await getCurrentPokemon(userId)
    const basePoke:Pokemon = await getPokemonById(currentPoke.id)
    if(currentPoke.level >= 100) return;
    
    await myPokemonCollection.updateOne(
        { ownerId: userId, "pokemon.id": currentPoke.id },
        { $inc : {
            "pokemon.$.hp"      : Math.ceil(basePoke.hp / 50),
            "pokemon.$.attack"  : Math.ceil(basePoke.attack / 50),
            "pokemon.$.speed"   : Math.ceil(basePoke.speed / 50),
            "pokemon.$.defense" : Math.ceil(basePoke.defense / 50),
            "pokemon.$.level"   : 1
        }}
    )
}

////////////////
// MY POKEMON //
////////////////

/**
 * Retrieves the full list of Pokémon owned by the specified user.
 * 
 * @param ownerId - The ObjectId of the user whose Pokémon list is requested.
 * @returns A promise that resolves to an array of FullPokemon objects belonging to the user.
 *          Returns an empty array if the user has no Pokémon or if an error occurs.
 */
export async function getMyPokemon(ownerId : ObjectId):Promise<FullPokemon[]> {
    try {
        const test = await myPokemonCollection.find({}).toArray()
        const userData:MyPokemon | null = await myPokemonCollection.findOne({ ownerId : ownerId });
        if (userData) {
            return userData.pokemon;
        } else {
            return [];
        }
    } catch (error) {
        console.error(error)
    }
    return [];
}

/**
 * Retrieves a specific Pokémon by its ID from the given user's Pokémon collection.
 * 
 * @param pokeId - The ID of the Pokémon to retrieve.
 * @param userId - The ObjectId of the user who owns the Pokémon.
 * @returns A promise that resolves to the FullPokemon object matching the given pokeId.
 *          If no matching Pokémon is found, the promise may resolve to undefined or cause an error.
 */
export async function getMyPokemonById(pokeId : number, userId : ObjectId):Promise<FullPokemon> {
    const myPoke : any = await myPokemonCollection.aggregate([
        { $match : {ownerId : userId}},
        { $unwind: "$pokemon" }, 
        { $match: { "pokemon.id": pokeId } },
        { $limit: 1 } 
    ]).toArray()
    return myPoke[0].pokemon
}

/**
 * Adds a full Pokémon with the specified level to the user's Pokémon collection.
 * If the user has no Pokémon yet, the newly caught Pokémon is set as the current active Pokémon.
 * 
 * @param pokeId - The ID of the Pokémon to catch.
 * @param userId - The ObjectId of the user who is catching the Pokémon.
 * @param level - The level to assign to the newly caught Pokémon.
 */
export async function catchPokemon(pokeId : number, userId : ObjectId, level : number) {
    let fullPoke : FullPokemon = await createFullPokemon(pokeId, level)
    const allMyPoke : FullPokemon[]= await getMyPokemon(userId)
    if(allMyPoke.length < 1) {
        fullPoke.currentPokemon = true
    }
    allMyPoke.push(fullPoke)
    await myPokemonCollection.updateOne({ownerId : userId},{$set : {pokemon : allMyPoke}})
}

/**
 * Changes the nickname of a specific Pokémon owned by the user.
 * The new nickname will be formatted to start with an uppercase letter followed by lowercase letters.
 * 
 * @param pokeId - The ID of the Pokémon to rename.
 * @param userId - The ObjectId of the user who owns the Pokémon.
 * @param nickname - The new nickname to assign to the Pokémon.
 */
export async function renamePokemon(pokeId : number, userId : ObjectId, nickname : string) {
    let fullPoke : FullPokemon = await getMyPokemonById(pokeId, userId)
    const allMyPoke : FullPokemon[]= await getMyPokemon(userId)
    allMyPoke.map((poke) => {
        if(poke._id?.toString() === fullPoke._id?.toString()) {
            poke.nickname = `${nickname.charAt(0).toUpperCase()}${nickname.substring(1).toLowerCase()}`
        }
    })
    await myPokemonCollection.updateOne({ownerId : userId},{$set : {pokemon : allMyPoke}})
}

/**
 * Updates the current HP of a specific Pokémon owned by a user in the database.
 * 
 * @param ownerId - The ObjectId of the user who owns the Pokémon.
 * @param pokeId - The ID of the Pokémon whose current HP should be updated.
 * @param newHp - The new HP value to set for the Pokémon.
 */
export async function updateCurrentHp(ownerId: ObjectId, pokeId: number, newHp: number) {
    const result = await myPokemonCollection.updateOne(
        { ownerId: ownerId, "pokemon.id": pokeId },  
        { $set: { "pokemon.$.currentHp": newHp } }
      );

    if (result.matchedCount === 0) {
        console.log(`No pokemon found for owner ${ownerId} with pokeId ${pokeId}`)
    }
}

/**
 * Clears the Pokémon array for a given user, effectively wiping all their Pokémon progress.
 * 
 * ⚠️ Use with caution: This action will delete all Pokémon owned by the user.
 * 
 * @param userId - The ObjectId of the user whose Pokémon array will be cleared.
 * @throws Will throw an error if the user cannot be found in the database.
 */
export async function deleteMyPokemon(userId : ObjectId) {
    let userData : MyPokemon | null = await myPokemonCollection.findOne({ownerId : userId})
    if(!userData) {
        throw new Error("Couldnt find user");
    } else {
        userData.pokemon = []
        await myPokemonCollection.updateOne({ownerId : userId}, {$set : {pokemon : userData.pokemon}})
    }
}

/**
 * Heals all Pokémon of a user based on the time elapsed since their last healing.
 * 
 * Each minute that has passed since the last healing increases the current HP of each Pokémon by 2,
 * up to their maximum HP.
 * 
 * After healing, the lastHealed timestamp of each Pokémon is updated to the current time.
 * 
 * @param userId - The ObjectId of the user whose Pokémon should be healed.
 */
export async function healPokemon(userId : ObjectId) {
    const pokemon = await getMyPokemon(userId)
    if(pokemon.length < 1) return;

    pokemon.forEach(poke => {
        const now = new Date();
        const healingIterations = Math.floor((now.getTime() - poke.lastHealed.getTime()) / 60000) // Increases by 1 every minute
        if(poke.currentHp < poke.hp) {
            poke.currentHp += 2*healingIterations
        }
        poke.currentHp = Math.min(poke.currentHp, poke.hp)
        poke.lastHealed = now
    })

    await myPokemonCollection.updateOne(
        { ownerId: userId},  
        { $set: {pokemon : pokemon}}
    );
}

/////////////////////
// CURRENT POKEMON //
/////////////////////

/**
 * Returns the current active Pokémon of the given user.
 * 
 * Searches the user's Pokémon list for the one marked as `currentPokemon`.
 * Throws an error if no current Pokémon is found.
 * 
 * @param userId - The ObjectId of the user whose current Pokémon is requested.
 * @returns A Promise resolving to the user's current FullPokemon.
 * @throws Error if no current Pokémon is set for the user.
 */
export async function getCurrentPokemon(userId : ObjectId):Promise<FullPokemon> {
    let allMyPoke = await getMyPokemon(userId)
    const currentPokemon = allMyPoke.find((poke) => {
        if (poke.currentPokemon === true) {
            return poke
        } 
    })
    if(typeof currentPokemon === "undefined" || !currentPokemon) {
        throw new Error("No currentPokemon");
    } else {
        return currentPokemon;
    }
}

/**
 * Sets the specified Pokémon as the current active Pokémon for the user.
 * 
 * Updates all Pokémon of the user so that only the Pokémon with the given `pokeId`
 * has `currentPokemon` set to true, and all others set to false.
 * 
 * @param pokeId - The ID of the Pokémon to set as current.
 * @param userId - The ObjectId of the user whose Pokémon is being updated.
 */
export async function changeCurrentPokemon(pokeId : number, userId : ObjectId) {
    let allMyPoke = await getMyPokemon(userId)
    const updatedPoke = allMyPoke.map((poke) => {
        if(poke.id === pokeId) {
            poke.currentPokemon = true
        } else {
            poke.currentPokemon = false
        }
        return poke
    })
    await myPokemonCollection.updateOne({ownerId : userId},{$set : {pokemon : updatedPoke}})
}


///////////
// USERS //
///////////

/**
 * Retrieves all users from the database.
 * 
 * @returns A promise that resolves to an array of User objects.
 *          Returns an empty array if there is an error during retrieval.
 */
async function getAllUsers():Promise<User[]> {
    try {
        const allUsers:User[] = await userCollection.find({}).toArray();
        return allUsers;
    } catch (error) {
        console.error(error)
    }
    return [];
}

/**
 * Retrieves a single user from the database by their ObjectId.
 * 
 * @param id - The ObjectId of the user to retrieve.
 * @returns A promise that resolves to the User object.
 * @throws Throws an error if the user is not found or if there is a database error.
 */
export async function getUserById(id:ObjectId):Promise<User> {
    try {
        const user:User | null = await userCollection.findOne({ _id : id });
                if(user){
            return user
        } else {
            throw new Error(`Failed to get user with id ${id} from database`);
        }
    } catch (error) {
        console.error(error)
    }
    throw new Error(`Failed to get user with id ${id} from database`);
}

// Creates the initial user, with credentials from .env file
async function createInitialUser() {
    if (await userCollection.countDocuments() > 0) {
        return;
    }
    let email : string | undefined = process.env.ADMIN_EMAIL;
    let username : string | undefined = process.env.ADMIN_USERNAME;
    let password : string | undefined = process.env.ADMIN_PASSWORD;
    if (email === undefined || username === undefined || password === undefined) {
        throw new Error("ADMIN_EMAIL, ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env");
    }
    await userCollection.insertOne({
        email: email,
        username: username,
        password: await bcrypt.hash(password, saltRounds),
        role: "ADMIN"
    });

    const user = await userCollection.find({ email : email }).toArray()
    await myPokemonCollection.insertOne({
        ownerId : user[0]._id,
        pokemon : []
    })

    console.log("🌱👤 Created initial user");
}

/**
 * Creates the initial admin user in the database using credentials
 * specified in environment variables (ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD).
 * 
 * This function only runs if there are no existing users in the user collection.
 * It hashes the password before storing, assigns the "ADMIN" role,
 * and also initializes an empty Pokémon collection for the new user.
 * 
 * @throws Throws an error if any of the required environment variables are missing.
 */
export async function createUser(username: string, email: string, password: string) {
    const existingUser = await userCollection.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        throw new Error("Username or email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await userCollection.insertOne({
        username,
        email,
        password: hashedPassword,
        role: "USER"
    });

    const user = await userCollection.find({ email : email }).toArray()
    await myPokemonCollection.insertOne({
        ownerId : user[0]._id,
        pokemon : []
    })

    console.log(`🆕👤 New user created: ${username}`);
}

/**
 * Validates user login by checking the provided username and password.
 * 
 * - Throws an error if either username or password is empty.
 * - Searches the database for a user matching the username.
 * - Compares the provided password with the stored hashed password using bcrypt.
 * - Returns the user object if authentication is successful.
 * - Throws an error if user is not found or password is incorrect.
 * 
 * @param username - The username string provided by the user attempting to login.
 * @param password - The plaintext password string provided by the user.
 * @returns The authenticated User object on successful login.
 * @throws Error if username or password is empty, user not found, or password is incorrect.
 */
export async function login(username: string, password: string) {
    if (username === "" || password === "") {
        throw new Error("Email and password required");
    }
    let user : User | null = await userCollection.findOne<User>({username: username});
    if (user) {
        if (await bcrypt.compare(password, user.password!)) {
            console.log(`🙋 Logged in as : \x1b[32m${user.username}\x1b[0m`);
            return user;
        } else {
            throw new Error("Password incorrect");
        }
    } else {
        throw new Error("User not found");
    }
}

//////////////
// Database //
//////////////

/**
 * Seeds the pokedexCollection in the database with all Pokémon data fetched from an external API.
 * 
 * - First clears the existing data in the pokedexCollection by deleting all documents.
 * - Fetches a full list of Pokémon from the external source (e.g., PokeAPI).
 * - Inserts the fetched Pokémon list into the pokedexCollection.
 * - Logs any errors encountered during the process.
 */
async function seed() {
    try {
        await pokedexCollection.deleteMany();
        const pokeList: Pokemon[] = await getPokemonList()
        await pokedexCollection.insertMany(pokeList);
    } catch (error) {
        console.log(error)
    }
}

/**
 * Gracefully closes the database connection and then terminates the application.
 * 
 * - Attempts to close the MongoDB client connection.
 * - Logs a confirmation message upon successful disconnection.
 * - Catches and logs any errors that occur during the disconnection process.
 * - Exits the Node.js process with code 0 to indicate a clean shutdown.
 */
async function exit() {
    try {
        await client.close();
        console.log("\n❌ Disconnected from database");
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

/**
 * Connects to the database and performs initial setup if necessary.
 * 
 * - Establishes a connection to the MongoDB client.
 * - Logs a success message once connected.
 * - Checks if the pokedex collection contains exactly 151 documents; if not, it calls `seed()` to populate it.
 * - Logs a message after seeding the pokedex.
 * - Creates the initial admin user if none exists.
 * - Sets up a listener for the SIGINT signal (Ctrl+C) to gracefully close the database connection on app shutdown.
 * - Catches and logs any errors during the connection or initialization process.
 */
export async function connect() {
    try {
        await client.connect();
        console.log("✅ Connected to database");
        if(await pokedexCollection.countDocuments() != 151){
            await seed();
            console.log("🌱 Seeded pokedex");
        }
        await createInitialUser();
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}