import { Collection, MongoClient } from "mongodb";
import { getPokemonList } from "./middleware/fetchPokemon";
import { PokemonStats, User } from "./interfaces";
import dotenv from "dotenv"

dotenv.config();
const link = process.env.MONGO_URI ||""
const client = new MongoClient(link);
const pokeCollection : Collection<PokemonStats> = client.db("FetchEmAll").collection("pokemon");
const userCollection : Collection<any> = client.db("FetchEmAll").collection("users")


export async function getAllPokemon():Promise<PokemonStats[]> {
    try {
        const allPokemon:PokemonStats[] = await pokeCollection.find({}).toArray();
        return allPokemon;
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function getPokemonById(id:number):Promise<PokemonStats[]> {
    try {
        const pokemon:PokemonStats[] = await pokeCollection.find({ id : id }).toArray();
        return pokemon
    } catch (error) {
        console.error(error)
    }
    return [];
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

async function getUserById(id:number):Promise<User[]> {
    try {
        const user:User[] = await userCollection.find({ id : id }).toArray();
        return user
    } catch (error) {
        console.error(error)
    }
    return [];
}

async function createUser(email:string, username:string) {
    const newUser:User = {
        userId : (await userCollection.countDocuments()) + 1,
        username : username,
        email : email,
        pokemon : null,
        currentPokemon : null
    }
    userCollection.insertOne(newUser)
}

async function seed() {
    try {
        pokeCollection.deleteMany();
        const pokeList: PokemonStats[] = await getPokemonList()
        pokeCollection.insertMany(pokeList);
        console.log(pokeCollection.countDocuments())
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
        if(await pokeCollection.countDocuments() != 151){
            seed()
        }
        // createUser("example@email.com", "John Doe")
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}