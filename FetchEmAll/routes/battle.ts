import express from "express";
import { FullPokemon } from "../interfaces";
import { multiplierToIndexMapper, indexToMultiplierMapper } from "../middleware/fetchPokemon"
import { getCurrentPokemon, createFullPokemon, catchPokemon } from "../database";
import { secureMiddleware } from "../middleware/secureMiddleware";

let battleState: {
    user: FullPokemon | null;
    ai: FullPokemon | null;
    turn: 'user' | 'ai';
    log: string[];
} = {
    user: null,
    ai: null,
    turn: 'user',
    log: [],
};

const battleRoute = express.Router();

battleRoute.get("/", secureMiddleware, async (req, res) => {
    let playerPoke : FullPokemon = await getCurrentPokemon(res.locals.user._id)
    const aiPokeId : number = typeof req.query.id === "string" ? parseInt(req.query.id) : 1;
    const aiPokeLevel : number = 1
    const aiPoke : FullPokemon = await createFullPokemon(aiPokeId, aiPokeLevel)

    const firstTurn = playerPoke.speed >= aiPoke.speed ? 'user' : 'ai';

    battleState = {
        user: playerPoke,
        ai: aiPoke,
        turn: firstTurn,
        log: [
            `A wild ${aiPoke.name} appeared!`,
            `Go! ${playerPoke.name}!`,
            `${firstTurn === 'user' ? 'You go' : 'The opponent goes'} first!`,
        ]
    };

    res.render("battle", {
        user: playerPoke,
        ai: aiPoke,
        log: battleState.log.join("\n"),
        logLength: battleState.log.length,
    });
});

battleRoute.post("/attack", (req, res) => {
    const lastLogIndex = parseInt(req.body.lastLogIndex || "0");
    const { user, ai, turn } = battleState;
    if (!user || !ai) return res.redirect("/");

    const attacker = turn === "user" ? user : ai;
    const defender = turn === "user" ? ai : user;

    const crit = Math.random() < 0.1 ? 1.4 : 1.0;
    const multiplier = getTypeDamage(attacker, defender);
    const stab = attacker.types.includes(attacker.types[0]) ? 1.2 : 1.0;
  
    const baseDamage = Math.floor(
        ((2 * attacker.level / 5 + 2) * attacker.attack * 60 / defender.defense / 50) + 2
    );
    const totalDamage = Math.floor(baseDamage * multiplier * stab * crit);
    defender.currentHp -= totalDamage;
    battleState.log.push(`${attacker.name} used a basic move!`);
    battleState.log.push(`It dealt ${totalDamage} damage!`);
    if (defender.currentHp <= 0) {
        defender.currentHp = 0;
        defender.isFainted = true;
        battleState.log.push(`${defender.name} fainted!`);
    }

    if (!defender.isFainted) {
        battleState.turn = turn === "user" ? "ai" : "user";
    }
    const newLog = battleState.log.slice(lastLogIndex);
    res.render("battle", {
        user: battleState.user,
        ai: battleState.ai,
        log: newLog.join("\n"),
        logLength: battleState.log.length,
    });
});

battleRoute.post("/catch", secureMiddleware, async (req, res) => {
    const { ai } = battleState;
    const lastLogIndex = parseInt(req.body.lastLogIndex || "0");
    if (!ai) return res.redirect("/");

    const hpFactor = ai.currentHp / ai.hp; // Lower HP = easier
    const captureChance = (ai.capture_rate / 255) * (1 - hpFactor) * 1.5;

    battleState.log.push(`You threw a Pokéball...`);
    if (Math.random() < captureChance) {
        ai.isFainted = true;
        await catchPokemon(ai.id, res.locals.user._id, ai.level)
        battleState.log.push(`Gotcha! ${ai.name} was caught!`);
    } else {
        battleState.log.push(`${ai.name} broke free!`);
        // Switch turn to AI if still alive
        if (!ai.isFainted) {battleState.turn = "ai";}
    }
    const newLog = battleState.log.slice(lastLogIndex);

    res.render("battle", {
        user: battleState.user,
        ai: battleState.ai,
        log: newLog.join("\n"),
        logLength: battleState.log.length
    });
});

function getTypeDamage(attacker : FullPokemon, defender : FullPokemon) : number {
    let mult : number = 1
    if(defender.type_damage[0].includes(attacker.types[0])) {
        mult *= 0
    } else if (defender.type_damage[2].includes(attacker.types[0])) {
        mult /= 2
    } else if (defender.type_damage[3].includes(attacker.types[0])) {
        mult *= 1
    } else if (defender.type_damage[4].includes(attacker.types[0])) {
        mult *= 2
    }
    if(attacker.type_damage.length === 1) {
        return mult
    }
    if(defender.type_damage[0].includes(attacker.types[1])) {
        mult *= 0
    } else if (defender.type_damage[2].includes(attacker.types[1])) {
        mult /= 2
    } else if (defender.type_damage[3].includes(attacker.types[1])) {
        mult *= 1
    } else if (defender.type_damage[4].includes(attacker.types[1])) {
        mult *= 2
    }
    return mult
}

function getDamageMultiplier(attacker: FullPokemon, defender: FullPokemon): number {
    const attackerTypes = attacker.types;
    const TypeDamage = attacker.type_damage[4];
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


battleRoute.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default battleRoute;