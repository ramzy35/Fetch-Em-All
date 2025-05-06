import { Collection, MongoClient } from "mongodb";
import { getPokemonList } from "./middleware/fetchPokemon";
import { MyPokemon, Pokemon, User } from "./interfaces";
import dotenv from "dotenv"
import { isNull } from "util";

dotenv.config();
const link = process.env.MONGO_URI ||""
const client = new MongoClient(link);
const pokeCollection : Collection<Pokemon> = client.db("FetchEmAll").collection("pokemon");
const userCollection : Collection<any> = client.db("FetchEmAll").collection("users")


export async function getAllPokemon():Promise<Pokemon[]> {
    try {
        const allPokemon:Pokemon[] = await pokeCollection.find({}).toArray();
        return allPokemon;
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function getPokemonById(id:number):Promise<Pokemon[]> {
    try {
        const pokemon:Pokemon[] = await pokeCollection.find({ id : id }).toArray();
        return pokemon
    } catch (error) {
        console.error(error)
    }
    return [];
}

export async function catchPokemon(pokeId : number, userId : number, pokeLevel : number) {
    const basePoke:Pokemon[] = await getPokemonById(pokeId)
    const user = await getUserById(userId)
    const fullPoke : MyPokemon = {
        ...basePoke[0],
        MaxHP : basePoke[0].hp + 1/50 * pokeLevel * basePoke[0].hp,
        currentHp: basePoke[0].hp + 1/50 * pokeLevel * basePoke[0].hp,
        currentAttack: basePoke[0].attack + 1/50 * pokeLevel * basePoke[0].attack,
        currentSpeed: basePoke[0].speed + 1/50 * pokeLevel * basePoke[0].speed,
        currentDefense : basePoke[0].defense + 1/50 * pokeLevel * basePoke[0].defense,
        isFainted: false,
        level: pokeLevel,
    }
    if (user.currentPokemon === null) {
        user.currentPokemon = fullPoke.id;
    }
    user.pokemon?.push(fullPoke)
    await userCollection.updateOne({userId : userId}, {$set : user})
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

async function getUserById(id:number):Promise<User> {
    try {
        const user:User = await userCollection.findOne({ userId : id });
        return user
    } catch (error) {
        console.error(error)
    }
    return await userCollection.findOne({ userId : 1 });
}

async function createUser(email:string, username:string) {
    const allPokemon = await getAllPokemon()
    // const somePokemon = allPokemon.filter((poke) => {
    //     return poke.name.includes("p")
    // })
    const newUser:User = {
        userId : (await userCollection.countDocuments()) + 1,
        username : username,
        email : email,
        pokemon : [],
        currentPokemon : null
    }
    userCollection.insertOne(newUser)
}


export async function getMyPokemon(userId:number):Promise<Pokemon[]> {
    try {
        const user: User = await getUserById(userId)
        if(user.pokemon){
            const myPokemon: Pokemon[] = user.pokemon
            return myPokemon
        }
    } catch (error) {
        console.error(error)
    }
    return [];
}

async function seed() {
    try {
        pokeCollection.deleteMany();
        const pokeList: Pokemon[] = await getPokemonList()
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
        await userCollection.deleteMany()
        createUser("example@email.com", "John Doe")
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}