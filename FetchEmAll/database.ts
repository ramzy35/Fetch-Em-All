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

/**
 * Most used parameters:
 * 
 * @param userId:ObjectId   is the auto-generated objectId for a user in the userCollection, stored in the session token
 * @param pokeId:number     is the ID for a Pokémon in the pokedexCollection
 */

dotenv.config();
export const link = process.env.MONGO_URI || ""
const client = new MongoClient(link);

// saltRounds for password encryption
const saltRounds : number = 10;

// Database collections to store pokedex, users, and users' pokemon
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
        const allPokemon:Pokemon[] = (await pokedexCollection.find().sort({ id : 1 }).toArray());
        return allPokemon;
    } catch (error) {
        console.error(error)
    }
    return [];
}

/**
 * Retrieves a single Pokémon from the database by its ID.
 * 
 * @returns A promise that resolves to the Pokémon object.
 * @throws An error if no Pokémon with the given ID is found or if the retrieval fails.
 */
export async function getPokemonById(pokeId:number):Promise<Pokemon> {
    try {
        const pokemon:Pokemon | null = await pokedexCollection.findOne({ id : pokeId });
        if(pokemon){
            return pokemon
        } else {
            throw new Error(`Failed to get Pokemon with id ${pokeId} from database`);
        }
    } catch (error) {
        console.error(error)
    }
    throw new Error(`Failed to get Pokemon with id ${pokeId} from database`);
}

//////////////////
// FULL POKEMON //
//////////////////

/**
 * Calculates the scaled stat values based on the Pokémon's base stats and level.
 * 
 * @param stats - The array of base stats of the Pokémon
 * @param pokeLevel - The level to scale the Pokémon's stats to.
 * @returns The scaled stat values, rounded up to the nearest integer.
 */
function scaleStat(stats : number[], pokeLevel: number): number[] {
    stats.forEach(stat => {
        stat = Math.ceil(stat + (pokeLevel - 1) * stat / 50);
    });
    return stats
}

/**
 * Creates a FullPokemon object by retrieving base Pokémon data and scaling stats
 * according to the given level. Initializes additional fields required for a user's Pokémon.
 * 
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
 * Scales the Pokémon's stats compared to their base values.
 * Does nothing if the Pokémon is already at level 100.
 * 
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
 * Retrieves the full list of Pokémon owned by the user.
 * 
 * @returns A promise that resolves to an array of FullPokemon objects belonging to the user.
 *          Returns an empty array if the user has no Pokémon or if an error occurs.
 */
export async function getMyPokemon(userId : ObjectId):Promise<FullPokemon[]> {
    try {
        const test = await myPokemonCollection.find({}).toArray()
        const userData:MyPokemon | null = await myPokemonCollection.findOne({ ownerId : userId });
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
 * Retrieves a specific Pokémon by its ID from the user's Pokémon collection.
 * 
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
 * @param newHp - The new HP value to set for the Pokémon.
 */
export async function updateCurrentHp(userId: ObjectId, pokeId: number, newHp: number) {
    const result = await myPokemonCollection.updateOne(
        { ownerId: userId, "pokemon.id": pokeId },  
        { $set: { "pokemon.$.currentHp": newHp } }
      );

    if (result.matchedCount === 0) {
        console.log(`No pokemon found for owner ${userId} with pokeId ${pokeId}`)
    }
}

/**
 * Clears the Pokémon array for a given user, effectively wiping all their Pokémon progress.
 * Use with caution!
 * 
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
 * Retrueves the current active Pokémon from the user.
 * 
 * Searches the user's Pokémon list for the one marked as `currentPokemon`.
 * Throws an error if no current Pokémon is found.
 * 
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
 * Retrieves all users from the database. Not used in the current application.
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
 * @returns A promise that resolves to the User object.
 * @throws Throws an error if the user is not found or if there is a database error.
 */
export async function getUserById(userId:ObjectId):Promise<User> {
    try {
        const user:User | null = await userCollection.findOne({ _id : userId });
                if(user){
            return user
        } else {
            throw new Error(`Failed to get user with id ${userId} from database`);
        }
    } catch (error) {
        console.error(error)
    }
    throw new Error(`Failed to get user with id ${userId} from database`);
}

/**
 * Creates the initial admin user in the database using credentials
 * specified in environment variables (empty variables seen in .env.template)
 * 
 * This function only runs if there are no existing users in the user collection.
 * It hashes the password before storing, assigns the "ADMIN" role,
 * and also initializes an empty Pokémon collection for the new user.
 * 
 * @throws Throws an error if any of the required environment variables are missing.
 */
async function createInitialUser() {
    if (await userCollection.countDocuments() > 0) {
        return;
    }
    let email : string | undefined = process.env.ADMIN_EMAIL;
    let username : string | undefined = process.env.ADMIN_USERNAME;
    let password : string | undefined = process.env.ADMIN_PASSWORD;
    if (email === undefined || username === undefined || password === undefined) {
        throw new Error("Admin credentials must be set in .env");
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
 * Creates a new user with given credentials and initialises their Pokémon collection
 * 
 * This function only runs if there are no existing users in the user collection.
 * It hashes the password before storing, assigns the "ADMIN" role,
 * and also initializes an empty Pokémon collection for the new user.
 * 
 * @param username contains the chosen username of the account
 * @param email contains the email of the account
 * @param password contains the password of the account which is hashed before being stored in the database
 * @throws Throws an error if the email or username are already used for another account.
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
 * @param username - The username provided by the user attempting to login.
 * @param password - The plaintext password provided by the user.
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
 * An error during seeding will not result in a crash, it'll likely just cause some pokemon to not correctly be added.
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
 * Closes the database connection and then terminates the application.
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