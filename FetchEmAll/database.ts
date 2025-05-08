import { Collection, MongoClient } from "mongodb";
import { getPokemonList } from "./middleware/fetchPokemon";
import { MyPokemon, Pokemon, User } from "./interfaces";
import dotenv from "dotenv"

dotenv.config();
const link = process.env.MONGO_URI || ""
const client = new MongoClient(link);

const pokedexCollection : Collection<Pokemon> = client.db("FetchEmAll").collection<Pokemon>("pokedex");
const userCollection : Collection<User> = client.db("FetchEmAll").collection<User>("users")
const myPokemonCollection : Collection<MyPokemon> = client.db("FetchEmAll").collection<MyPokemon>("myPokemon")

export async function getAllPokemon():Promise<Pokemon[]> {
    try {
        const allPokemon:Pokemon[] = await pokedexCollection.find({}).sort({ id : 1 }).toArray();
        return allPokemon;
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function getAllOwnedPokemon():Promise<MyPokemon[]> {
    try {
        const allPokemon:MyPokemon[] = await myPokemonCollection.find({}).toArray();
        return allPokemon;
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function getPokemonById(id:number):Promise<Pokemon[]> {
    try {
        const pokemon:Pokemon[] = await pokedexCollection.find({ id : id }).toArray();
        return pokemon
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function createFullPokemon(pokeId : number, pokeLevel : number, userId : number):Promise<MyPokemon> {
    const basePoke:Pokemon[] = await getPokemonById(pokeId)
    const fullPoke : MyPokemon = {
        ...basePoke[0],
        MaxHP : basePoke[0].hp + 1/50 * pokeLevel * basePoke[0].hp,
        currentHp: basePoke[0].hp + 1/50 * pokeLevel * basePoke[0].hp,
        currentAttack: basePoke[0].attack + 1/50 * pokeLevel * basePoke[0].attack,
        currentSpeed: basePoke[0].speed + 1/50 * pokeLevel * basePoke[0].speed,
        currentDefense : basePoke[0].defense + 1/50 * pokeLevel * basePoke[0].defense,
        isFainted: false,
        level: pokeLevel,
        currentPokemon: false,
        ownerId : userId
    }
    return fullPoke
}

export async function getFullPokemon(pokeId : number, userId : number):Promise<MyPokemon[]> {
    return await myPokemonCollection.find({$and : [{ownerId : userId}, {id : pokeId}]}).toArray()
}

export async function getCurrentPokemon(userId : number):Promise<MyPokemon[]> {
    const currentPokemon : MyPokemon[] = await myPokemonCollection.find({$and : [{ownerId : userId}, {currentPokemon : true}]}).toArray()
    if (!Array.isArray(currentPokemon) || !currentPokemon.length) {
        return [];
    }
    return currentPokemon;
}

export async function changeCurrentPokemon(pokeId : number, userId : number) {
    const newCurrentPoke : MyPokemon[] = await getFullPokemon(pokeId, userId)
    await myPokemonCollection.updateMany({ _id : {$ne : newCurrentPoke[0]._id} }, {currentPokemon : false})
    await myPokemonCollection.updateOne({ _id : newCurrentPoke[0]._id }, {currentPokemon : true})
}

export async function catchPokemon(pokeId : number, userId : number, pokeLevel : number) {
    const fullPoke : MyPokemon = await createFullPokemon(pokeId, pokeLevel, userId)
    await myPokemonCollection.insertOne(fullPoke)
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

export async function getUserById(id:number):Promise<User[]> {
    try {
        const user:User[] = await userCollection.find({ userId : id }).toArray();
        return user
    } catch (error) {
        console.error(error)
    }
    return [];
}

async function createUser(email:string, username:string) {
    const newestUser : User[] = await userCollection.find({}).sort({userId: -1}).limit(1).toArray();
    const newId = newestUser[0] ? newestUser[0].userId + 1 : 1
    const newUser:User = {
        userId : newId,
        username : username,
        email : email
    }
    userCollection.insertOne(newUser)
}


export async function getMyPokemon(userId:number):Promise<Pokemon[]> {
    try {
        const myPokemon : MyPokemon[] = await myPokemonCollection.find({ownerId : userId}).toArray()
        return myPokemon
    } catch (error) {
        console.error(error)
    }
    return [];
}

async function seed() {
    try {
        pokedexCollection.deleteMany();
        const pokeList: Pokemon[] = await getPokemonList()
        pokedexCollection.insertMany(pokeList);
        console.log(pokedexCollection.countDocuments())
    } catch (error) {
        console.log(error)
    }
}

async function exit() {
    try {
        await client.close();
        console.log("Disconnected from database");
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

export async function connect() {
    try {
        await client.connect();
        console.log("Connected to database");
        if(await pokedexCollection.countDocuments() != 151){
            seed()
        }
        await userCollection.deleteMany()
        await myPokemonCollection.deleteMany()
        createUser("example@email.com", "John Doe")
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}