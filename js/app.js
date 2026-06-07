// Referencias a los elementos del DOM
const galeria = document.getElementById("galeria");
const btnCargar = document.getElementById("cargar");
const inputBuscar = document.getElementById("buscar");

// Variable global para almacenar los datos y poder filtrarlos luego
let pokemonesGlobal = [];

// Función para obtener los datos de la API
async function cargarDatos() {
    galeria.innerHTML = "<p>Cargando Pokémon...</p>";
    
    try {
        // Hacemos el fetch a la PokéAPI (limitado a 50 para no sobrecargar)
        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=50");
        
        // Validación de respuesta de red
        if (!res.ok) throw new Error("Error en la conexión: " + res.status);
        
        const data = await res.json();
        
        // La PokéAPI devuelve una lista de URLs, necesitamos hacer fetch de los detalles para tener la imagen
        const promesas = data.results.map(async (poke) => {
            const resDetalle = await fetch(poke.url);
            if (!resDetalle.ok) throw new Error("Error al obtener detalles de " + poke.name);
            return await resDetalle.json();
        });

        // Esperamos a que todos los detalles se carguen
        pokemonesGlobal = await Promise.all(promesas);
        
        // Renderizamos las tarjetas
        mostrarPokemones(pokemonesGlobal);

    } catch (error) {
        // Manejo de errores en pantalla y consola
        galeria.innerHTML = `<p style="color: #ff6b6b;">No se pudieron cargar los datos. Intenta nuevamente.</p>`;
        console.error(error);
    }
}

// Función para renderizar las tarjetas en el HTML
function mostrarPokemones(lista) {
    galeria.innerHTML = ""; // Limpiamos la galería
    
    if(lista.length === 0) {
        galeria.innerHTML = "<p>No se encontraron resultados.</p>";
        return;
    }

    lista.forEach(pokemon => {
        // Validación de datos requerida en el reto antes de usarlos
        if (!pokemon || !pokemon.name || !pokemon.sprites) return;

        const card = document.createElement("article");
        card.className = "tarjeta";
        
        // Buscamos el mejor sprite (imagen oficial o el por defecto)
        const imagenUrl = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;

        card.innerHTML = `
            <img src="${imagenUrl}" alt="Imagen de ${pokemon.name}">
            <h3>${pokemon.name}</h3>
            <p>Nº ${pokemon.id}</p>
        `;
        
        galeria.appendChild(card);
    });
}

// Evento: Al hacer clic en el botón "Cargar Datos"
btnCargar.addEventListener("click", cargarDatos);

// BONUS NIVEL EXPERTO: Buscador funcional en vivo
inputBuscar.addEventListener("input", (e) => {
    const textoBusqueda = e.target.value.toLowerCase();
    
    // Filtramos el array global en base a lo que el usuario escribe
    const filtrados = pokemonesGlobal.filter(poke => 
        poke.name.toLowerCase().includes(textoBusqueda)
    );
    
    // Mostramos solo los que coinciden
    mostrarPokemones(filtrados);
});