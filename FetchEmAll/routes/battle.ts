import express from "express";
import { PokemonStats } from "../pokemonStats";
import { multiplierToIndexMapper, indexToMultiplierMapper } from "../middleware/fetchPokemon"
import { getPokemonById } from "../database";

let battleState: {
    user: MyPokemon | null;
    ai: MyPokemon | null;
    turn: 'user' | 'ai';
    log: string[];
} = {
    user: null,
    ai: null,
    turn: 'user',
    log: [],
};

const battleRoute = express.Router();

export interface MyPokemon extends PokemonStats {
    currentHp: number;
    isFainted: boolean;
    level: number;
}

battleRoute.get("/", async (req, res) => {
    const charmander:MyPokemon = prepareForBattle(await getPokemonById(4));
    const bulbasaur:MyPokemon = prepareForBattle(await getPokemonById(1));

    const firstTurn = charmander.speed >= bulbasaur.speed ? 'user' : 'ai';

    battleState = {
        user: charmander,
        ai: bulbasaur,
        turn: firstTurn,
        log: [
            `A wild ${bulbasaur.name} appeared!`,
            `Go! ${charmander.name}!`,
            `${firstTurn === 'user' ? 'You' : 'The opponent'} go first!`,
        ]
    };

    res.render("battle", {
        user: charmander,
        ai: bulbasaur,
        log: battleState.log.join("\n")
    });
});

battleRoute.post("/attack", (req, res) => {
    const { user, ai, turn } = battleState;
    if (!user || !ai) return res.redirect("/");

    const attacker = turn === "user" ? user : ai;
    const defender = turn === "user" ? ai : user;

    const crit = Math.random() < 0.1 ? 1.4 : 1.0;
    const multiplier = getDamageMultiplier(attacker, defender);
    const stab = attacker.types.includes(attacker.types[0]) ? 1.2 : 1.0;

    const baseDamage = Math.floor(
        ((((2 * attacker.level / 5 + 2) * attacker.attack * 60) / defender.defense) / 50) + 2
    );
    const totalDamage = Math.floor(baseDamage * multiplier * stab * crit);

    defender.currentHp -= totalDamage;
    if (defender.currentHp <= 0) {
        defender.currentHp = 0;
        defender.isFainted = true;
        battleState.log.push(`${attacker.name} used a basic move!`);
        battleState.log.push(`It dealt ${totalDamage} damage!`);
        battleState.log.push(`${defender.name} fainted!`);
    } else {
        battleState.log.push(`${attacker.name} used a basic move!`);
        battleState.log.push(`It dealt ${totalDamage} damage.`);
    }

    // Only switch turn if both are still alive
    if (!defender.isFainted) {
        battleState.turn = turn === "user" ? "ai" : "user";
    }

    res.render("battle", {
        user: battleState.user,
        ai: battleState.ai,
        log: battleState.log.join("\n")
    });
});

battleRoute.post("/catch", (req, res) => {
    const { ai } = battleState;
    if (!ai) return res.redirect("/");

    const hpFactor = ai.currentHp / ai.hp; // Lower HP = easier
    const captureChance = (ai.capture_rate / 255) * (1 - hpFactor) * 1.5;

    if (Math.random() < captureChance) {
        ai.isFainted = true;
        battleState.log.push(`You threw a Pokéball...`);
        battleState.log.push(`Gotcha! ${ai.name} was caught!`);
    } else {
        battleState.log.push(`You threw a Pokéball...`);
        battleState.log.push(`${ai.name} broke free!`);
        // Switch turn to AI if still alive
        if (!ai.isFainted) battleState.turn = "ai";
    }

    res.render("battle", {
        user: battleState.user,
        ai: battleState.ai,
        log: battleState.log.join("\n")
    });
});

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

export function prepareForBattle(pokemon: PokemonStats[]): MyPokemon {
    return {
      ...pokemon[0],
      currentHp: pokemon[0].hp,
      isFainted: false,
      level: 50,
    };
}

battleRoute.get("/", async (req, res) => {
    let rawPokemon = await getPokemonById(1);
    const charmander = prepareForBattle(rawPokemon);
    rawPokemon = await getPokemonById(1);
    const squirtle = prepareForBattle(rawPokemon);
    res.render("battle", {
        user: charmander,
        ai: squirtle,
    });
});

export default battleRoute;