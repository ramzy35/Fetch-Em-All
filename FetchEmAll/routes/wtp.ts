import express from "express";
import { Pokemon } from "./pokedex";

const wtpRoute = express.Router();

function rndmPokeId() {
    return Math.floor(Math.random()*151)+1
}

let names : string[];

wtpRoute.get("/", async (req, res) => {
    names = res.locals.pokemonNameList
    res.render("wtp", {
        rndmPokeId
    });
});



async function autocomplete(input: any, names: string[]) {
    // Function derived from https://www.w3schools.com/howto/howto_js_autocomplete.asp, adapted to typescript
    // input: html element, pokeNameArr: string array with all pokemon names
    let currentFocus : number;
    
    input.addEventListener("input", function (this:any) {
        const val : string = this.value;
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        // itemContainer that holds values of items
        const itemContainer = document.createElement("DIV");
        itemContainer.setAttribute("id",    "wtp__form__autocomplete__list");
        itemContainer.classList.add("wtp__form__autocomplete__item");
        
        // Make sure parentnode exists before appending
        if (this.parentNode) {
            this.parentNode.appendChild(itemContainer); 
        } else {
            console.error("Parent node for autocomplete not found")
        }
 
        names.forEach(poke => {
            if (poke.substring(0, val.length).toLowerCase() == val.toLowerCase()) {
                // div for every element that matches val
                const matchingItems = document.createElement("DIV");
                matchingItems.innerHTML = `<strong>${poke.substring(0, val.length)}</strong>`;
                matchingItems.innerHTML += poke.substring(val.length);
                
                // input field to hold the current array item's 
                matchingItems.innerHTML += `<input type='hidden' value='${poke}'>`;
                
                matchingItems.addEventListener("click", function (this: any) {
                    // input clicked pokemon name
                    input.value = this.getElementsByTagName("input")[0].value;
                
                    closeAllLists();
                });
                itemContainer.appendChild(matchingItems);
            }
        });
    });
    
    input.addEventListener("keydown", function (e:any) {
        let selectedName:any = document.getElementById("wtp__form__autocomplete__list");
        if (selectedName) selectedName = selectedName.getElementsByTagName("div");
        if (e.keyCode === 40) {
            // => downArrow
            console.log("down")
            e.preventDefault()
            currentFocus++;
            addActive(selectedName);
        } else if (e.keyCode === 38) {
            // => upArrow
            console.log("up")
            e.preventDefault()
            currentFocus--;
            addActive(selectedName);
        } else if (e.keyCode === 13) {
            // => Enter
            // Prevent from submitting form, other functionality added
            e.preventDefault();
            if (currentFocus > -1) {
                // Enter selects hovered/selected name from list
                if (selectedName) selectedName[currentFocus].click();
            }
        }
    });

    function addActive(itemList: HTMLElement[]) {
        if (!itemList) return false;
        removeActive(itemList);
        if (currentFocus >= itemList.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (itemList.length - 1);
        // Add active class for styling
        itemList[currentFocus].classList.add("wtp__form__autocomplete__item--active");
    }

    function removeActive(itemList: HTMLElement[]) {
        for (const el of itemList) {
            el.classList.remove("wtp__form__autocomplete__item--active")
        }
    }

    function closeAllLists(elmnt?: HTMLElement) {
        
        const itemList = document.getElementsByClassName("wtp__form__autocomplete__item");
        for (const el of itemList) {
            if (elmnt != el && elmnt != input) {
                el.parentNode?.removeChild(el);
            }
        }
        // Can't use foreach because itemlist is HTMLCollectionOf<Element>
        for (var i = 0; i < itemList.length; i++) {
            if (elmnt != itemList[i] && elmnt != input) {
                itemList[i].parentNode?.removeChild(itemList[i]);
            }
        }
    }
    // close list if user clicks off
    document.addEventListener("click", function (e) {
        closeAllLists();
    })
}

// document.addEventListener("DOMContentLoaded", async () => {
//     getPokemonList1().then(pokemonList => {
//         showRandomImage(pokemonList)
//         autocomplete(document.getElementById("wtp__form__input__field"), getPokemonNames(pokemonList));
//     })   
// });


const submitBtn = document.getElementById("wtp__form__reveal")
submitBtn?.addEventListener("click", () => {
    const pokeImg = document.getElementById("wtp__image--reveal")
    pokeImg?.classList.remove("wtp__image")
    pokeImg?.classList.add("wtp__image--revealPokemon")
})

export default wtpRoute;