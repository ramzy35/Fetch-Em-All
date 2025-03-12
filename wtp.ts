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

async function autocomplete(inp: any, arr: string[]) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus: number;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function (this: any, e: any) {
        var a: any, b: any, i: any, val: any = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].substring(0, val.length).toUpperCase() == val.toUpperCase()) {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + arr[i].substring(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substring(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function (this: any, e:any) {
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function (this: any, e: any) {
        var x: any = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x: any) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x: any) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt?: any) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode?.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    })
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}




document.addEventListener("DOMContentLoaded", async () => {
    getPokemonList1().then(pokemonList => {
        showRandomImage(pokemonList)
        autocomplete(document.getElementById("myInput"), getPokemonNames(pokemonList));
    })

});


