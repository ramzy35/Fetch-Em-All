"use strict";
// class Pokemon {
//     name: string = "";
//     id: number;
//     types: string[] = [];
//     frontImg: string = "";
//     typeColor: string = "#fff";
//     didYouCatchEm: boolean = false;
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
//     constructor(id: number) {
//         this.id = id;
//     }
//     //TODO: idk if this is needed, just for storing data in the class
//     // the actual bg color is changed on line 79
//     private static getTypeColor(type: string): string {
//         const typeColors: { [key: string]: string } = {
//             bug: "#9dc130",
//             dark: "#5f606d",
//             dragon: "#0773c7",
//             electric: "#edd53f",
//             fairy: "#ef97e6",
//             fighting: "#d94256",
//             fire: "#fc6c6d",
//             flying: "#9bb4e8",
//             ghost: "#7975d3",
//             grass: "#5dbd62",
//             ground: "#d78555",
//             ice: "#97d7d7",
//             normal: "#9a9da1",
//             poison: "#b462cc",
//             psychic: "#f85888",
//             rock: "#c2b062",
//             steel: "#b8b8d0",
//             water: "#60a5fa"
//         };
//         return typeColors[type] || "#fff";
//     }
//     async fetchPokemonDataById(): Promise<Pokemon> {
//         try {
//             const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${this.id}`);
//             if (!response.ok) throw new Error(`Pokemon not found: ${response.statusText}`);
//             const data = await response.json();
//             this.name = data.name;
//             this.types = data.types ? data.types.map((t: any) => t.type.name) : [];
//             this.frontImg = data.sprites.front_default;
//             this.typeColor = Pokemon.getTypeColor(this.types[0]);
//             return this;
//         } catch (error) {
//             console.error("Error fetching Pokémon", error);
//             return this;
//         }
//     }
//     //TODO: release/catch needed??? toggle between catch and release
//     catchEm() {
//         this.didYouCatchEm = !this.didYouCatchEm;
//         const card = document.querySelector(`.pokedex__card[data-id='${this.id}']`) as HTMLElement;
//         if (card) {
//         card.style.borderColor = this.didYouCatchEm ? "#05d605" : "#ac2323";
//         }
//     }
// }
var pokemon_js_1 = require("./pokemon.js");
function getPokemonList() {
    return __awaiter(this, void 0, void 0, function () {
        var promises, i, poke;
        return __generator(this, function (_a) {
            promises = [];
            for (i = 1; i <= 151; i++) {
                poke = new pokemon_js_1.Pokemon(i);
                promises.push(poke.fetchPokemonDataById());
            }
            return [2 /*return*/, Promise.all(promises)];
        });
    });
}
function buildPokedex(list) {
    var pokedexSection = document.querySelector(".pokedex");
    if (!pokedexSection) {
        console.log("Pokedex section not found?!");
        return;
    }
    list.forEach(function (pokemon) {
        var card = document.createElement("section");
        card.classList.add("pokedex__card", "type-".concat(pokemon.types[0]));
        card.setAttribute("data-id", pokemon.id.toString());
        var left = document.createElement("section");
        left.classList.add("pokedex__card__left");
        var idElement = document.createElement("p");
        idElement.classList.add("pokedex__card__left__id");
        idElement.textContent = "#".concat(pokemon.id);
        var nameElement = document.createElement("h2");
        nameElement.classList.add("pokedex__card__left__name");
        nameElement.textContent = pokemon.name;
        var typesElement = document.createElement("p");
        typesElement.classList.add("pokedex__card__left__types");
        typesElement.textContent = pokemon.types.join(", ");
        left.appendChild(nameElement);
        left.appendChild(idElement);
        left.appendChild(typesElement);
        var frontImgElement = document.createElement("img");
        frontImgElement.classList.add("pokedex__card__img--front");
        frontImgElement.src = pokemon.frontImg;
        frontImgElement.alt = "".concat(pokemon.name, " image");
        card.appendChild(left);
        card.appendChild(frontImgElement);
        pokedexSection.appendChild(card);
    });
}
// document.addEventListener("DOMContentLoaded", async () => {
//     getPokemonList().then(pokemonList => {
//         buildPokedex(pokemonList);
//     });
// });
document.addEventListener("DOMContentLoaded", function () { return __awaiter(void 0, void 0, void 0, function () {
    var pokemonList, firstPokemon, secondPoke;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getPokemonList()];
            case 1:
                pokemonList = _a.sent();
                buildPokedex(pokemonList);
                firstPokemon = pokemonList[0];
                secondPoke = pokemonList[4];
                firstPokemon.catchEm();
                secondPoke.catchEm();
                return [2 /*return*/];
        }
    });
}); });
