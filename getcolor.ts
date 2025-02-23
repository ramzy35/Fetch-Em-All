function getColorByPokemonType (pokemonTypes: string[]) {
    let typePokemon = pokemonTypes[0];
    let color = "";
    switch (typePokemon){
        case "bug":
            color = "#9dc130"
            break;
        case "dark":
            color = "#5f606d"
            break;
        case "dragon":
            color = "#0773c7"
            break;
        case "electric":
            color = "#edd53f"
            break;
        case "fairy":
            color = "ef97e6"
            break;
        case "fighting":
            color = "#d94256"
            break;
        case "fire":
            color = "#fc6c6d"
            break;
        case "flying":
            color = "#9bb4e8"
            break;
        case "ghost":
            color = "#7975d3"
            break;
        case "grass":
            color = "#00FF00";
            break;
        case "ground":
            color = "#d78555"
            break;
        case "ice":
            color = "#97d7d7"
            break;
        case "normal":
            color = "#9a9da1"
            break;
        case "poison":
            color = "#b462cc"
            break;
        case "psychic":
            color = "#f85888"
            break;
        case "rock":
            color = "#c2b062"
            break;
        case "steel":
            color = "#b8b8d0"
            break;
        case "water":
            color = "#60a5fa"
            break;
    }
    return color;
}