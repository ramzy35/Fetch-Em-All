import { AggregationCursor, Collection, Document, MongoClient, ObjectId } from "mongodb";
import { getPokemonList } from "./middleware/fetchPokemon";
import { FullPokemon, MyPokemon, Pokemon, User } from "./interfaces";
import dotenv from "dotenv"
import bcrypt from "bcrypt"

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

// Get all pokemon from pokedexCollection, sorted by id
export async function getAllPokemon():Promise<Pokemon[]> {
    try {
        const allPokemon:Pokemon[] = (await pokedexCollection.find({}).sort({ id : 1 }).toArray());
        return allPokemon;
    } catch (error) {
        console.error(error)
    }
    return [];
}

// Get 1 pokemon from database with given id
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

function scaleStat(base: number, level: number): number {
    return Math.floor(base + (level - 1) * base / 50);
}

// Add all needed stats and increase stats to add Pokemon to user
export async function createFullPokemon(pokeId : number, pokeLevel : number):Promise<FullPokemon> {
    const basePoke:Pokemon = await getPokemonById(pokeId)
    // Add all needed stats to convert from Type Pokemon to MyPokemon
    let fullPoke : FullPokemon = {
        ...basePoke,
        currentHp: Math.ceil(basePoke.hp + 1/50 * (pokeLevel - 1) * basePoke.hp),
        isFainted: false,
        level: pokeLevel,
        currentPokemon: false,
        nickname: basePoke.name
    }
    fullPoke.hp        = scaleStat(basePoke.hp, pokeLevel);
    fullPoke.attack    = scaleStat(basePoke.attack, pokeLevel);
    fullPoke.speed     = scaleStat(basePoke.speed, pokeLevel);
    fullPoke.defense   = scaleStat(basePoke.defense, pokeLevel);

    return fullPoke
}

// Upgrade current pokemon by 1 level
export async function levelPokemon(userId : ObjectId) {
    const currentPoke:FullPokemon = await getCurrentPokemon(userId)
    const basePoke:Pokemon = await getPokemonById(currentPoke.id)

    await myPokemonCollection.updateOne(
        { ownerId: userId, "pokemon.id": currentPoke.id },
        { $inc : {
            "pokemon.$.hp"      : (basePoke.hp / 50),
            "pokemon.$.attack"  : (basePoke.attack / 50),
            "pokemon.$.speed"   : (basePoke.speed / 50),
            "pokemon.$.defense" : (basePoke.defense / 50),
            "pokemon.$.level"   : 1
        }}
    )
}

////////////////
// MY POKEMON //
////////////////

// Get full list of all pokemon of given user
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

// Get pokemon by Id out of pokemon array of given user
export async function getMyPokemonById(pokeId : number, userId : ObjectId):Promise<FullPokemon> {
    const myPoke : any = await myPokemonCollection.aggregate([
        { $match : {ownerId : userId}},
        { $unwind: "$pokemon" }, 
        { $match: { "pokemon.id": pokeId } },
        { $limit: 1 } 
    ]).toArray()
    return myPoke[0].pokemon
}

// Add full pokemon with given level to user
export async function catchPokemon(pokeId : number, userId : ObjectId, level : number) {
    let fullPoke : FullPokemon = await createFullPokemon(pokeId, level)
    const allMyPoke : FullPokemon[]= await getMyPokemon(userId)
    if(allMyPoke.length < 1) {
        fullPoke.currentPokemon = true
    }
    allMyPoke.push(fullPoke)
    await myPokemonCollection.updateOne({ownerId : userId},{$set : {pokemon : allMyPoke}})
}

// Change the nickname of the given pokemon
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

// Updates the current HP of a specific Pokemon owned by a user in the database.
export async function updateCurrentHp(ownerId: ObjectId, pokeId: number, newHp: number) {
    const result = await myPokemonCollection.updateOne(
        { ownerId: ownerId, "pokemon.id": pokeId },  
        { $set: { "pokemon.$.currentHp": newHp } }
      );

    if (result.matchedCount === 0) {
        console.log(`No pokemon found for owner ${ownerId} with pokeId ${pokeId}`)
    }
}

// Clear the pokemon array for a given user | USE CAREFULLY, WIPS ALL PROGRESS
export async function deleteMyPokemon(userId : ObjectId) {
    let userData : MyPokemon | null = await myPokemonCollection.findOne({ownerId : userId})
    if(!userData) {
        throw new Error("Couldnt find user");
    } else {
        userData.pokemon = []
        await myPokemonCollection.updateOne({ownerId : userId}, {$set : {pokemon : userData.pokemon}})
    }
}

/////////////////////
// CURRENT POKEMON //
/////////////////////

// Returns the current pokemon of given user
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

// Switch the currentPokemon attribute to true for a different pokemon
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

// Get all users from database
async function getAllUsers():Promise<User[]> {
    try {
        const allUsers:User[] = await userCollection.find({}).toArray();
        return allUsers;
    } catch (error) {
        console.error(error)
    }
    return [];
}

// Get 1 user from database with given _id
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

// Create a new user with username, email and password
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

// Validate user login by checking username and hashed password
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

//  Add all pokemon to pokedex to seed database from pokeapi
async function seed() {
    try {
        await pokedexCollection.deleteMany();
        const pokeList: Pokemon[] = await getPokemonList()
        await pokedexCollection.insertMany(pokeList);
    } catch (error) {
        console.log(error)
    }
}

//  Close the database connection, then stop application
async function exit() {
    try {
        await client.close();
        console.log("\n❌ Disconnected from database");
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

// Connect to database and check if seeding is needed
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