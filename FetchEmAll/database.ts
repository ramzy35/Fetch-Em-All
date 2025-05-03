import { Collection, MongoClient } from "mongodb";
import express from "express";
import { getPokemonList } from "./middleware/fetchPokemon";
import { PokemonStats } from "./pokemonStats";
import dotenv from "dotenv"

dotenv.config();
const link = process.env.MONGO_URI ||""
export const client = new MongoClient(link);
export const pokeCollection : Collection<PokemonStats> = client.db("FetchEmAll").collection("pokemon");


export async function getAllPokemon() {
    return await pokeCollection.find({}).toArray();
}

export async function getPokemonById(id:number) {
    return await pokeCollection.find({ id : id }).toArray();
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
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}