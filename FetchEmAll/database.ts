import { Collection, MongoClient, ObjectId } from "mongodb";
import { getPokemonList } from "./middleware/fetchPokemon";
import { FullPokemon, MyPokemon, Pokemon, User } from "./interfaces";
import dotenv from "dotenv"
import bcrypt from "bcrypt";
import { isNull } from "util";

dotenv.config();
export const link = process.env.MONGO_URI || ""
const client = new MongoClient(link);

const saltRounds : number = 10;

const pokedexCollection     : Collection<Pokemon> = client.db("FetchEmAll").collection<Pokemon>("pokedex");
const userCollection        : Collection<User> = client.db("FetchEmAll").collection<User>("users");
const myPokemonCollection   : Collection<MyPokemon> = client.db("FetchEmAll").collection<MyPokemon>("myPokemon");

export async function getAllPokemon():Promise<Pokemon[]> {
    try {
        const allPokemon:Pokemon[] = (await pokedexCollection.find({}).sort({ id : 1 }).toArray());
        return allPokemon;
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function getAllOwnedPokemon(ownerId : ObjectId):Promise<FullPokemon[]> {
    try {
        const onePoke = await myPokemonCollection.findOne({})
        const allPokemon:MyPokemon | null = await myPokemonCollection.findOne({ ownerId : ownerId });
        if (typeof allPokemon === "undefined" || !allPokemon) {
            return [];
        } else {
            return allPokemon.pokemon;
        }
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function getPokemonById(id:number):Promise<Pokemon[]> {
    try {
        const pokemon:Pokemon[] = (await pokedexCollection.find({ id : id }).toArray());
        return pokemon.slice(0, 1)
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function createFullPokemon(pokeId : number, pokeLevel : number):Promise<FullPokemon> {
    const basePoke:Pokemon[] = await getPokemonById(pokeId)
    // Add all needed stats to convert from Type Pokemon to MyPokemon
    let fullPoke : FullPokemon = {
        ...basePoke[0],
        currentHp: basePoke[0].hp + 1/50 * pokeLevel * basePoke[0].hp,
        isFainted: false,
        level: pokeLevel,
        currentPokemon: false,
    }
    fullPoke.hp        = basePoke[0].hp + (pokeLevel - 1) * basePoke[0].hp / 50;
    fullPoke.attack    = basePoke[0].attack + (pokeLevel - 1) * basePoke[0].attack / 50;
    fullPoke.speed     = basePoke[0].speed + (pokeLevel - 1) * basePoke[0].speed / 50;
    fullPoke.defense   = basePoke[0].defense + (pokeLevel - 1) * basePoke[0].defense / 50;
    return fullPoke
}

async function levelPokemon(pokeId : number, userId : ObjectId) {
    const basePoke:Pokemon[] = await getPokemonById(pokeId)
    // :FullPokemon = await getMyPokemonById(userId, pokeId)
    let myPoke: FullPokemon | undefined = await getMyPokemonById(userId, pokeId)

    if(myPoke) {
        myPoke.hp        = basePoke[0].hp + basePoke[0].hp / 50
        myPoke.attack    = basePoke[0].attack + basePoke[0].attack / 50
        myPoke.speed     = basePoke[0].speed + basePoke[0].speed / 50
        myPoke.defense   = basePoke[0].defense + basePoke[0].defense / 50
    }


    allMyPoke.shift
    await myPokemonCollection.updateOne({ _id : userId }, {$set : {
        pokemon : all
    }})
}

export async function getFullPokemon(pokeId : number, userId : ObjectId):Promise<MyPokemon[]> {
    return await myPokemonCollection.find({$and : [{ownerId : userId}, {id : pokeId}]}).toArray()
}

export async function getCurrentPokemon(userId : ObjectId):Promise<MyPokemon[]> {
    const currentPokemon : MyPokemon[] = await myPokemonCollection.find({$and : [{ownerId : userId}, {currentPokemon : true}]}).sort({ level : 1 }).toArray()
    if(currentPokemon.length === 0 || currentPokemon === undefined || !currentPokemon) {
        return [];
    } else {
        // If more than 1 pokemon has currentpokemon = true, only return one (with highest level)
        return currentPokemon.slice(0, 1);
    }
}

export async function deleteMyPokemon(userId : ObjectId) {
    await myPokemonCollection.deleteMany({ownerId : userId})
}

export async function getMyPokemonById(userId:ObjectId, pokeId : number) {
    try {
        const myPokemon : MyPokemon | null =  await myPokemonCollection.aggregate([
            {{"pokemon.id" : pokeId}}
        ])
        console.log(getPokemonById)
        console.log(myPokemon)
        if (myPokemon) {
            return myPokemon
        }

        
    } catch (error) {
        console.error(error)
    }
}
export async function changeCurrentPokemon(pokeId : number, userId : ObjectId) {
    // Switch the currentPokemon attribute to true for a different pokemon
    const newCurrentPoke : MyPokemon[] = await getFullPokemon(pokeId, userId)
    await myPokemonCollection.updateMany({ _id : {$ne : newCurrentPoke[0]._id} }, {currentPokemon : false})
    await myPokemonCollection.updateOne({ _id : newCurrentPoke[0]._id }, {currentPokemon : true})
}

export async function catchPokemon(pokeId : number, userId : ObjectId, pokeLevel : number) {

    // Add a full pokemon to user with given level, then apply leveled stats
    const fullPoke : FullPokemon = await createFullPokemon(pokeId, pokeLevel)
    const allPokemon : FullPokemon[] = await getAllOwnedPokemon(userId)
    console.log(allPokemon)
    allPokemon.push(fullPoke)

    await myPokemonCollection.updateOne({ _id : userId }, {$set : {
        pokemon : allPokemon
    }})
    await levelPokemon(fullPoke.id, userId, pokeLevel)
}

async function getAllUsers():Promise<User[]> {
    try {
        const allUsers:User[] = await userCollection.find({}).toArray();
        return allUsers;
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function getUserById(id:ObjectId):Promise<User[]> {
    try {
        const user:User[] = await userCollection.find({ _id : id }).toArray();
        return user
    } catch (error) {
        console.error(error)
    }
    return [];
}

// async function createUser(email:string, username:string) {
//     const newestUser : User[] = await userCollection.find({}).sort({userId: -1}).limit(1).toArray();
//     const newId = newestUser[0] ? newestUser[0].userId + 1 : 1
//     const newUser:User = {
//         userId : newId,
//         username : username,
//         email : email
//     }
//     userCollection.insertOne(newUser)
// }

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

async function seed() {
    // Add all pokemon to pokedex to seed database
    try {
        await pokedexCollection.deleteMany();
        const pokeList: Pokemon[] = await getPokemonList()
        await pokedexCollection.insertMany(pokeList);
    } catch (error) {
        console.log(error)
    }
}

async function exit() {
    try {
        await client.close();
        console.log("❌ Disconnected from database");
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

export async function connect() {
    try {
        await client.connect();
        console.log("✅ Connected to database");
        if(await pokedexCollection.countDocuments() != 151){
            await seed();
            console.log("🌱 Seeded pokedex");
        }
        await createInitialUser();
        // await userCollection.deleteMany()
        // await myPokemonCollection.deleteMany()
        // Temp code to add dummy user with pokemon
        // await createUser("example@email.com", "John Doe")
        // await catchPokemon(151, 1, 20)
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}