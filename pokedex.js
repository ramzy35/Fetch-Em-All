var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Pokemon {
    constructor(id) {
        this.name = "";
        this.types = [];
        this.frontImg = "";
        this.id = id;
    }
    fetchPokemonDataById() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`https://pokeapi.co/api/v2/pokemon/${this.id}`);
                if (!response.ok)
                    throw new Error(`Pokemon not found: ${response.statusText}`);
                const data = yield response.json();
                this.name = data.name;
                this.types = data.types ? data.types.map((t) => t.type.name) : [];
                this.frontImg = data.sprites.front_default;
                return this;
            }
            catch (error) {
                console.error("Error fetching Pokémon", error);
                return this;
            }
        });
    }
}
function getPokemonList() {
    return __awaiter(this, void 0, void 0, function* () {
        let promises = [];
        for (let i = 1; i <= 151; i++) {
            let poke = new Pokemon(i);
            promises.push(poke.fetchPokemonDataById());
        }
        return Promise.all(promises);
    });
}
function buildPokedex(list) {
    const pokedexSection = document.querySelector(".pokedex");
    if (!pokedexSection) {
        console.log("Pokedex section not found?!");
        return;
    }
    pokedexSection.innerHTML = '<h1 class="pokedex__title">Pokedex</h1>';
    list.forEach(pokemon => {
        const card = document.createElement("section");
        card.classList.add("pokedex__card");
        const left = document.createElement("section");
        left.classList.add("pokedex__card__left");
        const nameElement = document.createElement("h2");
        nameElement.classList.add("pokedex__card__left__name");
        nameElement.textContent = pokemon.name;
        const idElement = document.createElement("p");
        idElement.classList.add("pokedex__card__left__id");
        idElement.textContent = `#${pokemon.id}`;
        const typesElement = document.createElement("p");
        typesElement.classList.add("pokedex__card__left__types");
        typesElement.textContent = pokemon.types.join(", ");
        left.appendChild(nameElement);
        left.appendChild(idElement);
        left.appendChild(typesElement);
        const frontImgElement = document.createElement("img");
        frontImgElement.classList.add("pokedex__card__img--front");
        frontImgElement.src = pokemon.frontImg;
        frontImgElement.alt = `${pokemon.name} image`;
        card.appendChild(left);
        card.appendChild(frontImgElement);
        pokedexSection.appendChild(card);
    });
}
document.addEventListener("DOMContentLoaded", () => __awaiter(void 0, void 0, void 0, function* () {
    getPokemonList().then(pokemonList => {
        buildPokedex(pokemonList);
    });
}));
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
function displayPokemonOnCard() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, imgElement, nameElement, idElement, typesElement, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("https://pokeapi.co/api/v2/pokemon/1")];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Pokemon not found: ".concat(response.statusText));
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    imgElement = document.querySelector(".pokedex__card_img-front");
                    nameElement = document.querySelector(".pokedex__card__name");
                    idElement = document.querySelector(".pokedex__card__id");
                    typesElement = document.querySelector(".pokedex__card__types");
                    nameElement.textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1);
                    idElement.textContent = "#".concat(data.id);
                    typesElement.textContent = "".concat(data.types.map(function (t) { return t.type.name; }).join(", "));
                    imgElement.src = data.sprites.front_default;
                    imgElement.alt = "".concat(data.name, " image");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error fetching Pokémon", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// document.addEventListener("DOMContentLoaded", () => {
//     displayPokemonOnCard();
// });
