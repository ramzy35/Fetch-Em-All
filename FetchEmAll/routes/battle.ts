import express from "express";
import { FullPokemon } from "../interfaces";
import { getCurrentPokemon, createFullPokemon, catchPokemon, updateCurrentHp, levelPokemon, renamePokemon } from "../database";
import { secureMiddleware } from "../middleware/secureMiddleware";
import { ObjectId } from "mongodb";

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

function performAttack(attacker: FullPokemon, defender: FullPokemon, logs: string[], isAI: boolean = false): boolean {
    const crit = Math.random() < 0.1 ? 1.4 : 1.0;
    const multiplier = getTypeDamage(attacker, defender);
    const stab = attacker.types.includes(attacker.types[0]) ? 1.2 : 1.0;

    const baseDamage = Math.floor(
        ((2 * attacker.level / 5 + 2) * attacker.attack * 60 /  (Math.max(defender.level / 10, 2)* defender.defense) / 50) + 2
    );
    const totalDamage = Math.floor(baseDamage * multiplier * stab * crit);

    defender.currentHp -= totalDamage;

    console.log(`${attacker.name} viel ${defender.name} aan voor ${totalDamage} damage.`);

    if (attacker.abilities && attacker.abilities.length > 0 && Math.random() < 0.5) {
        const ability = attacker.abilities[Math.floor(Math.random() * attacker.abilities.length)];
        logs.push(`${attacker.name} gebruikt ${ability.name}!`);
        console.log(`${attacker.name} triggered ability: ${ability.name}`);
    } else {
        logs.push(`${attacker.name} viel aan!`);
        console.log(`${attacker.name} used a regular attack.`);
    }
    logs.push(`Het deed ${totalDamage} damage!`);

    if (defender.currentHp <= 0) {
        defender.currentHp = 0;
        defender.isFainted = true;
        logs.push(`${defender.name} valt flauw!`);
        console.log(`${defender.name} has fainted.`);
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
    console.log(`User attempted to catch ${ai.name}`);

    const hpFactor = ai.currentHp / ai.hp;
    const captureChance = (ai.capture_rate / 255) * (1 - hpFactor) * 1.5;

    logs.push(`Je gooit een Pokeball...`);

    if (Math.random() < captureChance) {
        ai.isFainted = true;
        await catchPokemon(ai.id, res.locals.user._id, ai.level);
        logs.push(`Gotcha! ${ai.name} is gevangen!`);
        console.log(`✅ Catch succeeded: ${ai.name} was caught.`);
        battleState.turn = "over";
    } else {
        logs.push(`${ai.name} verzet zich!`);
        console.log(`❌ Catch failed: ${ai.name} broke free.`);
        battleState.turn = "ai";
    }

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

        logs.push(`${attacker.name} viel aan!`);
        logs.push(`Het deed ${totalDamage} damage!`);

        console.log(`${attacker.name} viel ${defender.name} aan voor ${totalDamage} damage.`);

        if (defender.currentHp <= 0) {
            defender.currentHp = 0;
            defender.isFainted = true;
            logs.push(`${defender.name} valt flauw!`);
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
        console.log(`Nickname set: ${nickname} for Pokemon ID ${pokeId}`);
    }
    res.redirect("/myPokemon")
});

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