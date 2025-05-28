import express from "express";
import { FullPokemon } from "../interfaces";
import { getCurrentPokemon, createFullPokemon, catchPokemon, updateCurrentHp, levelPokemon, renamePokemon } from "../database";
import { secureMiddleware } from "../middleware/secureMiddleware";
import { ObjectId } from "mongodb";

/**
 * ============================================================================
 *  ⚙️  Documentation Notice
 * ============================================================================
 *
 * This file's inline documentation was initially generated with the help of AI.
 * All comments and descriptions have been carefully reviewed and proofread by
 * the developer to ensure accuracy and clarity.
 *
 * ============================================================================
 */

let battleState: {
    user: FullPokemon | null;
    ai: FullPokemon | null;
    turn: 'user' | 'ai' | 'over';
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
    const aiPokeLevel : number = Math.max(playerPoke.level +- Math.round(Math.random() * 3), 1);
    const aiPoke : FullPokemon = await createFullPokemon(aiPokeId, aiPokeLevel > 100 ? 100 : aiPokeLevel)

    const firstTurn = playerPoke.speed >= aiPoke.speed ? 'user' : 'ai';

    battleState = {
        user: playerPoke,
        ai: aiPoke,
        turn: firstTurn,
        log: [
            `Een wilde ${aiPoke.name} komt tevoorschijn!`,
            `Go! ${playerPoke.name}!`,
            `${firstTurn === 'user' ? 'Jij gaat' : 'De tegenstander gaat'} eerst!`,
        ]
    };

    const logs: string[] = [];

    if (firstTurn === 'ai') {
        const logs: string[] = [];
        performAttack(aiPoke, playerPoke, logs, true);
        battleState.log.push(...logs);
        battleState.turn = 'user';
    }

    const battleOver = (playerPoke.isFainted || aiPoke.isFainted);
    res.render("battle", {
        user: playerPoke,
        ai: aiPoke,
        log: battleState.log.join("\n"),
        logLength: battleState.log.length,
        battleOver: battleOver,
        caught: false,
    });
});

/**
 * Executes an attack from one Pokémon to another, calculates damage, and updates state.
 *
 * The function:
 * - Calculates critical hit chance (10% chance, 1.4x damage).
 * - Computes type effectiveness multiplier using `getTypeDamage`.
 * - Applies STAB (Same-Type Attack Bonus) if applicable (1.2x damage).
 * - Calculates total damage based on attacker and defender stats.
 * - Decreases defender's current HP by damage dealt.
 * - Randomly triggers an ability usage message or a generic attack message.
 * - Logs all relevant actions to the provided logs array.
 * - Updates defender's fainted status if HP falls to 0 or below.
 *
 * @param attacker - The attacking Pokémon, including stats and abilities.
 * @param defender - The defending Pokémon, including stats and current HP.
 * @param logs - Array of strings to which battle messages are appended.
 * @param isAI - Optional flag indicating if the attacker is AI-controlled (currently unused).
 * @returns A boolean indicating whether the defender has survived the attack (`true` if still standing).
 */
function performAttack(attacker: FullPokemon, defender: FullPokemon, logs: string[], isAI: boolean = false): boolean {
    const crit = Math.random() < 0.1 ? 1.4 : 1.0;
    const multiplier = getTypeDamage(attacker, defender);
    const stab = attacker.types.includes(attacker.types[0]) ? 1.2 : 1.0;

    const baseDamage = Math.floor(
        ((2 * attacker.level / 5 + 2) * attacker.attack * 60 /  (Math.max(defender.level / 10, 2)* defender.defense) / 50) + 2
    );
    const totalDamage = Math.floor(baseDamage * multiplier * stab * crit);

    defender.currentHp -= totalDamage;

    if (attacker.abilities && attacker.abilities.length > 0 && Math.random() < 0.5) {
        const ability = attacker.abilities[Math.floor(Math.random() * attacker.abilities.length)];
        logs.push(`${attacker.name} gebruikt ${ability.name}!`);
    } else {
        logs.push(`${attacker.name} viel aan!`);
    }
    logs.push(`Het deed ${totalDamage} damage!`);

    if (defender.currentHp <= 0) {
        defender.currentHp = 0;
        defender.isFainted = true;
        logs.push(`${defender.name} valt flauw!`);
    }

    return !defender.isFainted;
}

battleRoute.post("/attack", secureMiddleware, async (req, res) => {
    const lastLogIndex = parseInt(req.body.lastLogIndex || "0");
    const { user, ai, turn } = battleState;
    if (!user || !ai) return res.redirect("/");

    const logs: string[] = [];

    if (turn === "user") {
        const stillAlive = performAttack(user, ai, logs);
        battleState.log.push(...logs);
        if (!stillAlive) {
            levelPokemon(res.locals.user._id)
            battleState.turn = "over";
        } else {
            battleState.turn = "ai";
        }
    }

    if (battleState.turn === "ai" && !ai.isFainted) {
        logs.length = 0;
        const stillAlive = performAttack(ai, user, logs);
        battleState.log.push(...logs);
        if (!stillAlive) {
            battleState.turn = "over";
        } else {
            battleState.turn = "user";
        }
    }

    await updateCurrentHp(res.locals.user._id, user.id, user.currentHp);

    const newLog = battleState.log.slice(lastLogIndex);

    const battleOver = battleState.turn === "over";

    res.render("battle", {
        user: battleState.user,
        ai: battleState.ai,
        log: newLog.join("\n"),
        logLength: battleState.log.length,
        battleOver,
        caught: false,
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

    const hpFactor = ai.currentHp / ai.hp;
    const captureChance = (ai.capture_rate / 255) * (1 - hpFactor) * 1.5;

    logs.push(`Je gooit een Pokeball...`);

    if (Math.random() < captureChance) {
        ai.isFainted = true;
        await catchPokemon(ai.id, res.locals.user._id, ai.level);
        logs.push(`Gotcha! ${ai.name} is gevangen!`);
        battleState.turn = "over";
    } else {
        logs.push(`${ai.name} verzet zich!`);
        battleState.turn = "ai";
    }

    if (battleState.turn === "ai" && !ai.isFainted) {
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

        logs.push(`${attacker.name} viel aan!`);
        logs.push(`Het deed ${totalDamage} damage!`);

        if (defender.currentHp <= 0) {
            defender.currentHp = 0;
            defender.isFainted = true;
            logs.push(`${defender.name} valt flauw!`);
        }

        if (!defender.isFainted) {
            battleState.turn = "user";
        }
    }

    battleState.log.push(...logs);
    const newLog = battleState.log.slice(lastLogIndex);

    res.render("battle", {
        user: battleState.user,
        ai: battleState.ai,
        log: newLog.join("\n"),
        logLength: battleState.log.length,
        battleOver: battleState.turn === "over",
        caught: battleState.turn === "over",
    });
});

battleRoute.post("/caught", secureMiddleware, async (req, res) => {
    const pokeId : number = parseInt(req.body.pokeId);
    const userId : ObjectId = res.locals.user._id;
    const nickname : string = req.body.nickname;

    if (pokeId && nickname) {
        await renamePokemon(pokeId, userId, nickname);
    }
    res.redirect("/myPokemon")
});

/**
 * Calculates the type effectiveness multiplier for an attack from one Pokémon to another.
 *
 * Uses the attacker's types and the defender's `type_damage` chart to determine how effective
 * the attack will be. Multiplier logic:
 * - `0` for no damage
 * - `0.5` for half damage
 * - `1` for normal damage
 * - `2` for double damage
 *
 * If the attacker has two types, both are considered multiplicatively.
 *
 * @param attacker - The attacking Pokémon, including its types and type damage mappings.
 * @param defender - The defending Pokémon, with a `type_damage` array organized by multipliers.
 * @returns A numeric multiplier representing total type effectiveness (e.g. 0, 0.5, 1, 2, or 4).
 */
function getTypeDamage(attacker : FullPokemon, defender : FullPokemon) : number {
    let mult : number = 1
    if(defender.type_damage[0].includes(attacker.types[0])) {
        mult *= 0
    } else if (defender.type_damage[2].includes(attacker.types[0])) {
        mult *= 1/2
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
        mult *= 1/2
    } else if (defender.type_damage[3].includes(attacker.types[1])) {
        mult *= 1
    } else if (defender.type_damage[4].includes(attacker.types[1])) {
        mult *= 2
    }
    return mult
}

battleRoute.get("/:status", async (req, res) => {
    res.status(404);
    res.locals.currentPage = "404"
    res.render("404");
})

export default battleRoute;