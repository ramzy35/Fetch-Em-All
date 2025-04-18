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
var _this = this;
var Pokemon1 = /** @class */ (function () {
    function Pokemon1(id) {
        this.name = "";
        this.types = [];
        this.frontImg = "";
        this.typeColor = "#fff";
        this.didYouCatchEm = false;
        this.id = id;
    }
    Pokemon1.prototype.fetchPokemonDataById = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("https://pokeapi.co/api/v2/pokemon/".concat(this.id))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error("Pokemon not found: ".concat(response.statusText));
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        this.name = data.name;
                        this.types = data.types ? data.types.map(function (t) { return t.type.name; }) : [];
                        this.frontImg = data.sprites.front_default;
                        return [2 /*return*/, this];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Error fetching Pokémon", error_1);
                        return [2 /*return*/, this];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return Pokemon1;
}());
function getPokemonList1() {
    return __awaiter(this, void 0, void 0, function () {
        var promises, i, poke;
        return __generator(this, function (_a) {
            promises = [];
            for (i = 1; i <= 151; i++) {
                poke = new Pokemon1(i);
                promises.push(poke.fetchPokemonDataById());
            }
            return [2 /*return*/, Promise.all(promises)];
        });
    });
}
function getPokemonNames(pokemonList) {
    var pokeNameArr = [];
    pokemonList.forEach(function (poke) {
        pokeNameArr.push(poke.name);
    });
    return pokeNameArr;
}
function showRandomImage(list) {
    return __awaiter(this, void 0, void 0, function () {
        var randomId, imgUrl, imgSection, imgElement;
        return __generator(this, function (_a) {
            randomId = Math.floor(Math.random() * 151);
            imgUrl = list[randomId].frontImg;
            try {
                imgSection = document.getElementById("wtp__image");
                imgElement = document.createElement("img");
                if (imgElement) {
                    imgElement.src = imgUrl;
                    imgElement.classList.add("wtp__image");
                    imgElement.classList.add("selectDisable");
                    imgElement.id = "wtp__image--reveal";
                    imgElement.draggable = false;
                }
                else {
                    console.log("imgElement does not exist");
                }
                imgSection === null || imgSection === void 0 ? void 0 : imgSection.appendChild(imgElement);
            }
            catch (_b) {
                console.log("Failed to insert imgUrl into #wtp__img");
            }
            return [2 /*return*/, imgUrl];
        });
    });
}
function autocomplete(input, pokeNameArr) {
    return __awaiter(this, void 0, void 0, function () {
        function addActive(itemList) {
            if (!itemList)
                return false;
            removeActive(itemList);
            if (currentFocus >= itemList.length)
                currentFocus = 0;
            if (currentFocus < 0)
                currentFocus = (itemList.length - 1);
            // Add active class for styling
            itemList[currentFocus].classList.add("wtp__form__autocomplete__item--active");
        }
        function removeActive(itemList) {
            for (var _i = 0, itemList_1 = itemList; _i < itemList_1.length; _i++) {
                var el = itemList_1[_i];
                el.classList.remove("wtp__form__autocomplete__item--active");
            }
        }
        function closeAllLists(elmnt) {
            var _a, _b;
            var itemList = document.getElementsByClassName("wtp__form__autocomplete__item");
            for (var _i = 0, itemList_2 = itemList; _i < itemList_2.length; _i++) {
                var el = itemList_2[_i];
                if (elmnt != el && elmnt != input) {
                    (_a = el.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(el);
                }
            }
            // Can't use foreach because itemlist is HTMLCollectionOf<Element>
            for (var i = 0; i < itemList.length; i++) {
                if (elmnt != itemList[i] && elmnt != input) {
                    (_b = itemList[i].parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(itemList[i]);
                }
            }
        }
        var currentFocus;
        return __generator(this, function (_a) {
            input.addEventListener("input", function () {
                var val = this.value;
                closeAllLists();
                if (!val) {
                    return false;
                }
                currentFocus = -1;
                // itemContainer that holds values of items
                var itemContainer = document.createElement("DIV");
                itemContainer.setAttribute("id", "wtp__form__autocomplete__list");
                itemContainer.classList.add("wtp__form__autocomplete__item");
                // Make sure parentnode exists before appending
                if (this.parentNode) {
                    this.parentNode.appendChild(itemContainer);
                }
                else {
                    console.error("Parent node for autocomplete not found");
                }
                pokeNameArr.forEach(function (poke) {
                    if (poke.substring(0, val.length).toLowerCase() == val.toLowerCase()) {
                        // div for every element that matches val
                        var matchingItems = document.createElement("DIV");
                        matchingItems.innerHTML = "<strong>".concat(poke.substring(0, val.length), "</strong>");
                        matchingItems.innerHTML += poke.substring(val.length);
                        // input field to hold the current array item's 
                        matchingItems.innerHTML += "<input type='hidden' value='".concat(poke, "'>");
                        matchingItems.addEventListener("click", function () {
                            // input clicked pokemon name
                            input.value = this.getElementsByTagName("input")[0].value;
                            closeAllLists();
                        });
                        itemContainer.appendChild(matchingItems);
                    }
                });
            });
            input.addEventListener("keydown", function (e) {
                var selectedName = document.getElementById("wtp__form__autocomplete__list");
                if (selectedName)
                    selectedName = selectedName.getElementsByTagName("div");
                if (e.keyCode === 40) {
                    // => downArrow
                    console.log("down");
                    e.preventDefault();
                    currentFocus++;
                    addActive(selectedName);
                }
                else if (e.keyCode === 38) {
                    // => upArrow
                    console.log("up");
                    e.preventDefault();
                    currentFocus--;
                    addActive(selectedName);
                }
                else if (e.keyCode === 13) {
                    // => Enter
                    // Prevent from submitting form, other functionality added
                    e.preventDefault();
                    if (currentFocus > -1) {
                        // Enter selects hovered/selected name from list
                        if (selectedName)
                            selectedName[currentFocus].click();
                    }
                }
            });
            // close list if user clicks off
            document.addEventListener("click", function (e) {
                closeAllLists();
            });
            return [2 /*return*/];
        });
    });
}
document.addEventListener("DOMContentLoaded", function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        getPokemonList1().then(function (pokemonList) {
            showRandomImage(pokemonList);
            autocomplete(document.getElementById("wtp__form__input__field"), getPokemonNames(pokemonList));
        });
        return [2 /*return*/];
    });
}); });
var submitBtn = document.getElementById("wtp__form__reveal");
submitBtn === null || submitBtn === void 0 ? void 0 : submitBtn.addEventListener("click", function () {
    var pokeImg = document.getElementById("wtp__image--reveal");
    pokeImg === null || pokeImg === void 0 ? void 0 : pokeImg.classList.remove("wtp__image");
    pokeImg === null || pokeImg === void 0 ? void 0 : pokeImg.classList.add("wtp__image--revealPokemon");
});
