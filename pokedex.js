"use strict";
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
