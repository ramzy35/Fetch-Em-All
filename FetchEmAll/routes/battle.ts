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

    const logs: string[] = [];

    if (firstTurn === 'ai') {
        const logs: string[] = [];
        performAttack(aiPoke, playerPoke, logs, true);
        battleState.log.push(...logs);
        battleState.turn = 'user';
    }

    res.render("battle", {
        user: playerPoke,
        ai: aiPoke,
        log: battleState.log.join("\n"),
        logLength: battleState.log.length,
    });
});

function performAttack(attacker: FullPokemon, defender: FullPokemon, logs: string[], isAI: boolean = false): boolean {
    const crit = Math.random() < 0.1 ? 1.4 : 1.0;
    const multiplier = getTypeDamage(attacker, defender);
    const stab = attacker.types.includes(attacker.types[0]) ? 1.2 : 1.0;

    const baseDamage = Math.floor(
        ((2 * attacker.level / 5 + 2) * attacker.attack * 60 / defender.defense / 50) + 2
    );
    const totalDamage = Math.floor(baseDamage * multiplier * stab * crit);
    defender.currentHp -= totalDamage;

    console.log(`${attacker.name} attacked ${defender.name} for ${totalDamage} damage.`);

    if (attacker.abilities && attacker.abilities.length > 0 && Math.random() < 0.5) {
        const ability = attacker.abilities[Math.floor(Math.random() * attacker.abilities.length)];
        logs.push(`${attacker.name} used ${ability.name}!`);
        console.log(`${attacker.name} triggered ability: ${ability.name}`);
    } else {
        logs.push(`${attacker.name} attacked!`);
        console.log(`${attacker.name} used a regular attack.`);
    }
    logs.push(`It dealt ${totalDamage} damage!`);

    if (defender.currentHp <= 0) {
        defender.currentHp = 0;
        defender.isFainted = true;
        logs.push(`${defender.name} fainted!`);
        console.log(`${defender.name} has fainted.`);
    }

    return !defender.isFainted;
}

battleRoute.post("/attack", (req, res) => {
    const lastLogIndex = parseInt(req.body.lastLogIndex || "0");
    const { user, ai, turn } = battleState;
    if (!user || !ai) return res.redirect("/");

    console.log(`User clicked Attack. Current turn: ${turn}`);

    const logs: string[] = [];

    if (turn === "user") {
        const stillAlive = performAttack(user, ai, logs);
        battleState.log.push(...logs);
        if (stillAlive) {
            battleState.turn = "ai";
        }
    }

    if (battleState.turn === "ai" && !ai.isFainted) {
        logs.length = 0; // clear logs for AI turn
        const stillAlive = performAttack(ai, user, logs);
        battleState.log.push(...logs);
        if (stillAlive) {
            battleState.turn = "user";
        }
    }

    const newLog = battleState.log.slice(lastLogIndex);

    console.log(`Turn ends. New turn: ${battleState.turn}`);

    res.render("battle", {
        user: battleState.user,
        ai: battleState.ai,
        log: newLog.join("\n"),
        logLength: battleState.log.length,
    });
});

battleRoute.post("/catch", secureMiddleware, async (req, res) => {
    const { user, ai, turn } = battleState;
    const lastLogIndex = parseInt(req.body.lastLogIndex || "0");
    if (!user || !ai) {
        console.error("User or AI Pokémon missing in battle state.");
        return res.redirect("/");
    }

    const logs: string[] = [];
    console.log(`User attempted to catch ${ai.name}`);

    const hpFactor = ai.currentHp / ai.hp;
    const captureChance = (ai.capture_rate / 255) * (1 - hpFactor) * 1.5;

    logs.push(`You threw a Pokeball...`);

    if (Math.random() < captureChance) {
        ai.isFainted = true;
        await catchPokemon(ai.id, res.locals.user._id, ai.level);
        logs.push(`Gotcha! ${ai.name} was caught!`);
        console.log(`✅ Catch succeeded: ${ai.name} was caught.`);
        res.redirect("/myPokemon");
    } else {
        logs.push(`${ai.name} broke free!`);
        console.log(`❌ Catch failed: ${ai.name} broke free.`);
        battleState.turn = "ai";
    }

    // If AI’s turn now
    if (battleState.turn === "ai" && !ai.isFainted) {
        console.log(`AI turn after failed catch.`);
        const attacker = ai;
        const defender = user;

        const crit = Math.random() < 0.1 ? 1.4 : 1.0;
        const multiplier = getTypeDamage(attacker, defender);
        const stab = attacker.types.includes(attacker.types[0]) ? 1.2 : 1.0;

        const baseDamage = Math.floor(
            ((2 * attacker.level / 5 + 2) * attacker.attack * 60 / defender.defense / 50) + 2
        );
        const totalDamage = Math.floor(baseDamage * multiplier * stab * crit);
        defender.currentHp -= totalDamage;

        logs.push(`${attacker.name} attacked!`);
        logs.push(`It dealt ${totalDamage} damage!`);

        console.log(`${attacker.name} attacked ${defender.name} for ${totalDamage} damage.`);

        if (defender.currentHp <= 0) {
            defender.currentHp = 0;
            defender.isFainted = true;
            logs.push(`${defender.name} fainted!`);
            console.log(`${defender.name} has fainted.`);
        }

        if (!defender.isFainted) {
            battleState.turn = "user";
        }
    }

    battleState.log.push(...logs);
    const newLog = battleState.log.slice(lastLogIndex);

    console.log(`Turn ends. New turn: ${battleState.turn}`);

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