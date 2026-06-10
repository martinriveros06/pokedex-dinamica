const galeria = document.getElementById("galeria");
const btnCargar = document.getElementById("cargar");
const inputBuscar = document.getElementById("buscar");

// Elementos del Modal
const modal = document.getElementById("modal-pokemon");
const cerrarModal = document.getElementById("cerrar-modal");
const infoPokemon = document.getElementById("info-pokemon");

let pokemonesGlobal = [];

async function cargarDatos() {
    galeria.innerHTML = "<p style='grid-column: 1 / -1; text-align: center;'>Cargando datos de todas las regiones... Esto puede tardar unos segundos.</p>";
    
    try {
        // Límite aumentado a 1025 para abarcar todas las generaciones
        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
        if (!res.ok) throw new Error("Error en la conexión");
        
        const data = await res.json();
        
        const promesas = data.results.map(async (poke) => {
            const resDetalle = await fetch(poke.url);
            return await resDetalle.json();
        });

        pokemonesGlobal = await Promise.all(promesas);
        mostrarPokemones(pokemonesGlobal);

    } catch (error) {
        galeria.innerHTML = `<p style="color: #ff6b6b; grid-column: 1 / -1; text-align: center;">Error al cargar. Revisa tu conexión.</p>`;
        console.error(error);
    }
}

function mostrarPokemones(lista) {
    galeria.innerHTML = ""; 
    
    if(lista.length === 0) {
        galeria.innerHTML = "<p style='grid-column: 1 / -1; text-align: center;'>No se encontraron resultados.</p>";
        return;
    }

    lista.forEach(pokemon => {
        if (!pokemon || !pokemon.name || !pokemon.sprites) return;

        const card = document.createElement("article");
        card.className = "tarjeta";
        
        const imgNormal = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
        const imgShiny = pokemon.sprites.other['official-artwork'].front_shiny || pokemon.sprites.front_shiny;
        
        const tiposHTML = pokemon.types.map(t => 
            `<span class="tipo tipo-${t.type.name}">${t.type.name}</span>`
        ).join('');

        card.innerHTML = `
            <div class="flip-contenedor" onclick="this.classList.toggle('rotado')" title="Haz clic para ver versión Shiny">
                <div class="flip-inner">
                    <img src="${imgNormal}" alt="${pokemon.name} normal" class="flip-frente">
                    <img src="${imgShiny}" alt="${pokemon.name} shiny" class="flip-dorso">
                </div>
            </div>
            <h3>${pokemon.name}</h3>
            <p>Nº ${pokemon.id}</p>
            <div class="contenedor-tipos">
                ${tiposHTML}
            </div>
            <button class="btn-info" onclick="abrirModal(${pokemon.id})">Ver Detalles</button>
        `;
        
        galeria.appendChild(card);
    });
}

// Lógica del Buscador en vivo
inputBuscar.addEventListener("input", (e) => {
    const textoBusqueda = e.target.value.toLowerCase();
    const filtrados = pokemonesGlobal.filter(poke => 
        poke.name.toLowerCase().includes(textoBusqueda)
    );
    mostrarPokemones(filtrados);
});

btnCargar.addEventListener("click", cargarDatos);

// --- LÓGICA DEL MODAL ---
window.abrirModal = function(id) {
    const poke = pokemonesGlobal.find(p => p.id === id);
    if(!poke) return;

    const imgNormal = poke.sprites.other['official-artwork'].front_default || poke.sprites.front_default;
    const altura = (poke.height / 10).toFixed(1); 
    const peso = (poke.weight / 10).toFixed(1); 
    
    infoPokemon.innerHTML = `
        <img src="${imgNormal}" alt="${poke.name}" style="width: 180px; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5));">
        <h2 style="text-transform: capitalize; color: #ffcc00; margin: 10px 0;">${poke.name}</h2>
        <div class="estadisticas">
            <p><strong>Nº Pokedex:</strong> ${poke.id}</p>
            <p><strong>Altura:</strong> ${altura} m</p>
            <p><strong>Peso:</strong> ${peso} kg</p>
            <p><strong>Exp. Base:</strong> ${poke.base_experience}</p>
        </div>
    `;
    
    modal.classList.replace("modal-oculto", "modal-visible");
}

cerrarModal.addEventListener("click", () => {
    modal.classList.replace("modal-visible", "modal-oculto");
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.replace("modal-visible", "modal-oculto");
    }
});