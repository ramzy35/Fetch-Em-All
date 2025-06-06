import { ObjectId } from "mongodb";

export interface Pokemon {
    _id?: ObjectId,
    name: string,
    id: number,
    front_image: string,
    types: string[],
    height: number,
    weight: number,
    evolution_chain: PokemonInfo[] | null,
    hp: number,
    attack: number,
    defense: number,
    special_attack: number,
    special_defense: number,
    speed: number,
    generation: string,
    habitat: string,
    capture_rate: number,
    growth_rate: string,
    ev_yield: string,
    base_experience: number,
    base_happiness: string,
    abilities: AbilityDescription[],
    type_damage: string[][],
}

export interface User {
    _id?: ObjectId;
    email: string;
    username: string;
    password?: string;
    role: "ADMIN" | "USER";
}

export interface FullPokemon extends Pokemon {
    currentHp: number;
    isFainted: boolean;
    level: number;
    currentPokemon: boolean;
    nickname: string;
    lastHealed : Date;
}

export interface MyPokemon {
    _id? : ObjectId;
    ownerId : ObjectId;
    pokemon : FullPokemon[];
}

export type EvolutionDetail = {
    min_level: number | null;
    trigger: { name: string; url: string };
    // THE REST IS NOT NEEDED
};
  
export type EvolutionChainLink = {
    species: { name: string; url: string };
    evolves_to: EvolutionChainLink[];
    evolution_details: EvolutionDetail[];
    is_baby: boolean;
};
  
export type EvolutionChain = {
    id: number;
    baby_trigger_item: any;
    chain: EvolutionChainLink;
};

export type PokemonInfo = {
    id: number;
    name: string;
    front_default: string;
};

export type Stat = {
    base_stat: number;
    effort: number;
    stat: {
        name: string;
        url: string;
    };
};

export type AbilityInfo = {
    ability: {
        name: string;
        url: string;
    };
    is_hidden: boolean;
    slot: number;
};
  
export type AbilityDescription = {
    name: string;
    description: string;
};

export * as type from "./interfaces";