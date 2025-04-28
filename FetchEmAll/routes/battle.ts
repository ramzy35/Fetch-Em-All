import express from "express";
import { Pokemon } from "./pokedex";
import { getPokemonStats, indexToMultiplierMapper, PokemonStats } from "../pokemonStats";

const battleRoute = express.Router();

export interface MyPokemon extends PokemonStats {
    currentHp: number;
    isFainted: boolean;
    level: number;
}

function getDamageMultiplier(attacker: MyPokemon, defender: MyPokemon): number {
    const attackerTypes = attacker.types;
    const defenderTypes = defender.types;
    const defenderTypeDamage = defender.type_damage;

    let damageMultiplier = 1;

    if (attackerTypes.length === 1) {
        const attackerType = attackerTypes[0];
        const defenderIndex = getDefenderTypeIndex(defenderTypes, defenderTypeDamage);
        if (defenderIndex >= 0)
        {
            damageMultiplier *= indexToMultiplierMapper(defenderIndex);
        }
    }
    else if (attackerTypes.length === 2) {
        const randomTypeIndex = Math.floor(Math.random() * 2);
        const attackerType = attackerTypes[randomTypeIndex];
        const defenderIndex = getDefenderTypeIndex(defenderTypes, defenderTypeDamage);
        if (defenderIndex >= 0)
        {
            damageMultiplier *= indexToMultiplierMapper(defenderIndex);
        }
    }
    return damageMultiplier;
}

function getDefenderTypeIndex(defenderTypes: string[], defenderTypeDamage: string[][]): number {
    let damageIndex = -1;
    for (const defenderType of defenderTypes) {
        const typeIndex = defenderTypeDamage.findIndex((damageArr) => damageArr.includes(defenderType));
        if (typeIndex !== -1) {
            damageIndex = typeIndex;
            break;
        }
    }
    return damageIndex;
}

export function prepareForBattle(pokemon: PokemonStats): MyPokemon {
    return {
      ...pokemon,
      currentHp: pokemon.hp,
      isFainted: false,
      level: 50,
    };
}

battleRoute.get("/", async (req, res) => {
    let rawPokemon = await getPokemonStats(1);
    const charmander = prepareForBattle(rawPokemon);
    rawPokemon = await getPokemonStats(1);
    const squirtle = prepareForBattle(rawPokemon);
    res.render("battle", {
        user: charmander,
        ai: squirtle,
    });
});

export default battleRoute;