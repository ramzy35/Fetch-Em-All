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

export async function createFullPokemon(pokeId : number, pokeLevel : number):Promise<FullPokemon> {
    const basePoke:Pokemon = await getPokemonById(pokeId)
    // Add all needed stats to convert from Type Pokemon to MyPokemon
    let fullPoke : FullPokemon = {
        ...basePoke,
        currentHp: basePoke.hp + 1/50 * pokeLevel * basePoke.hp,
        isFainted: false,
        level: pokeLevel,
        currentPokemon: false,
    }

    fullPoke.hp        = basePoke.hp + (pokeLevel - 1) * basePoke.hp / 50;
    fullPoke.attack    = basePoke.attack + (pokeLevel - 1) * basePoke.attack / 50;
    fullPoke.speed     = basePoke.speed + (pokeLevel - 1) * basePoke.speed / 50;
    fullPoke.defense   = basePoke.defense + (pokeLevel - 1) * basePoke.defense / 50;

    return fullPoke
}

// Upgrade given pokemon by 1 level
async function levelPokemon(pokeId : number, userId : ObjectId) {
    const basePoke = await getPokemonById(pokeId)
    let allMyPoke = await getMyPokemon(userId)

    const updatedPoke = allMyPoke.map((poke) => {
        if(poke.id === pokeId) {
            poke.hp        = poke.hp + basePoke.hp / 50
            poke.attack    = poke.attack + basePoke.attack / 50
            poke.speed     = poke.speed + basePoke.speed / 50
            poke.defense   = poke.defense + basePoke.defense / 50
        }
        return poke
    })

    await myPokemonCollection.updateOne({ownerId : userId},{$set : {pokemon : updatedPoke}})
}

////////////////
// MY POKEMON //
////////////////

export async function getMyPokemon(ownerId : ObjectId):Promise<FullPokemon[]> {
    try {
        const allPokemon:MyPokemon | null = await myPokemonCollection.findOne({ ownerId : ownerId });
        if (allPokemon) {
            return allPokemon.pokemon;
        } else {
            return [];
        }
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function getMyPokemonById(pokeId : number, userId : ObjectId):Promise<any> {
    const myPoke : any = await myPokemonCollection.aggregate([
        { $match : {ownerId : userId}},
        { $unwind: "$pokemon" }, 
        { $match: { "pokemon.id": pokeId } },
        { $limit: 1 } 
    ]).toArray()
    return myPoke[0]
}

export async function catchPokemon(pokeId : number, userId : ObjectId, level : number) {
    const fullPoke = await createFullPokemon(pokeId, level)
    let allMyPoke = await getMyPokemon(userId)
    const updatedPoke = allMyPoke.map((poke) => {
        if(poke.id === pokeId) {
            poke = fullPoke
        }
        return poke
    })
    await myPokemonCollection.updateOne({ownerId : userId},{$set : {pokemon : updatedPoke}})
}

export async function deleteMyPokemon(userId : ObjectId) {
    await myPokemonCollection.deleteMany({ownerId : userId})
}

/////////////////////
// CURRENT POKEMON //
/////////////////////

export async function getCurrentPokemon(userId : ObjectId):Promise<FullPokemon> {
    let allMyPoke = await getMyPokemon(userId)
    const currentPokemon = allMyPoke.find((poke) => {
        if (poke.currentPokemon) {
            return true
        } 
    })
    if(currentPokemon === undefined || !currentPokemon) {
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
        console.log("❌ Disconnected from database");
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