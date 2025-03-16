class Pokemon1 {
    name: string = "";
    id: number;
    types: string[] = [];
    frontImg: string = "";
    typeColor: string = "#fff";
    didYouCatchEm: boolean = false;

    constructor(id: number) {
        this.id = id;
    }


    async fetchPokemonDataById(): Promise<Pokemon1> {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${this.id}`);
            if (!response.ok) throw new Error(`Pokemon not found: ${response.statusText}`);
            const data = await response.json();

            this.name = data.name;
            this.types = data.types ? data.types.map((t: any) => t.type.name) : [];
            this.frontImg = data.sprites.front_default;

            return this;
        } catch (error) {
            console.error("Error fetching Pokémon", error);
            return this;
        }
    }
}

async function getPokemonList1(): Promise<Pokemon1[]> {
    let promises: Promise<Pokemon1>[] = [];

    for (let i = 1; i <= 151; i++) {
        let poke = new Pokemon1(i);
        promises.push(poke.fetchPokemonDataById());
    }

    return Promise.all(promises);
}

function getPokemonNames(pokemonList: Pokemon1[]): string[] {
    let pokeNameArr: string[] = []
    pokemonList.forEach((poke) => {
        pokeNameArr.push(poke.name)
    })
    return pokeNameArr
}

async function showRandomImage(list: Pokemon1[]) {
    let randomId = Math.floor(Math.random() * 151)
    // let pokeTest = new Pokemon1(randomId)
    let imgUrl = list[randomId].frontImg;
    try {
        const imgSection = document.getElementById("wtp__image")
        const imgElement = document.createElement("img")
        if (imgElement) {
            imgElement.src = imgUrl;
            imgElement.classList.add("wtp__image")
            imgElement.classList.add("selectDisable")
            imgElement.id = "wtp__image--reveal"
            imgElement.draggable = false;
        } else {
            console.log("imgElement does not exist")
        }
        imgSection?.appendChild(imgElement)

    } catch {
        console.log("Failed to insert imgUrl into #wtp__img")
    }

    return imgUrl
}






async function autocomplete(input: any, pokeNameArr: string[]) {
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
 
        pokeNameArr.forEach(poke => {
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

document.addEventListener("DOMContentLoaded", async () => {
    getPokemonList1().then(pokemonList => {
        showRandomImage(pokemonList)
        autocomplete(document.getElementById("wtp__form__input__field"), getPokemonNames(pokemonList));
    })   
});


const submitBtn = document.getElementById("wtp__form__reveal")
submitBtn?.addEventListener("click", () => {
    const pokeImg = document.getElementById("wtp__image--reveal")
    pokeImg?.classList.add("revealPokemon")
})



