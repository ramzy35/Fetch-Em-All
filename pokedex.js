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
function displayPokemonOnCard() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`https://pokeapi.co/api/v2/pokemon/1`);
            if (!response.ok)
                throw new Error(`Pokemon not found: ${response.statusText}`);
            const data = yield response.json();
            const imgElement = document.querySelector(".pokedex__card_img-front");
            const nameElement = document.querySelector(".pokedex__card__name");
            const idElement = document.querySelector(".pokedex__card__id");
            const typesElement = document.querySelector(".pokedex__card__types");
            nameElement.textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1);
            idElement.textContent = `#${data.id}`;
            typesElement.textContent = `${data.types.map((t) => t.type.name).join(", ")}`;
            imgElement.src = data.sprites.front_default;
            imgElement.alt = `${data.name} image`;
        }
        catch (error) {
            console.error("Error fetching Pokémon", error);
        }
    });
}
document.addEventListener("DOMContentLoaded", () => {
    displayPokemonOnCard();
});
