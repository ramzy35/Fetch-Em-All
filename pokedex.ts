async function displayPokemonOnCard() {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/1`);
        if (!response.ok) throw new Error(`Pokemon not found: ${response.statusText}`);
        const data = await response.json();
        const imgElement = document.querySelector(".pokedex__card_img-front") as HTMLImageElement;
        const nameElement = document.querySelector(".pokedex__card__name") as HTMLElement;
        const idElement = document.querySelector(".pokedex__card__id") as HTMLElement;
        const typesElement = document.querySelector(".pokedex__card__types") as HTMLElement;
        nameElement.textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        idElement.textContent = `#${data.id}`;
        typesElement.textContent = `${data.types.map((t: any) => t.type.name).join(", ")}`;
        imgElement.src = data.sprites.front_default;
        imgElement.alt = `${data.name} image`;
    } catch (error) {
        console.error("Error fetching Pokémon", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    displayPokemonOnCard();
});