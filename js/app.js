const galeria = document.getElementById("galeria");
const btnCargar = document.getElementById("cargar");
const inputBuscar = document.getElementById("buscar");
const selectTipo = document.getElementById("filtro-tipo");
const selectRegion = document.getElementById("filtro-region");

// Elementos del Modal
const modal = document.getElementById("modal-pokemon");
const cerrarModal = document.getElementById("cerrar-modal");
const infoPokemon = document.getElementById("info-pokemon");

let pokemonesGlobal = [];

async function cargarDatos() {
    galeria.innerHTML = "<p style='grid-column: 1 / -1; text-align: center;'>Cargando datos... Esto puede tardar unos segundos.</p>";
    
    try {
        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151"); // Usaremos 151 para que los filtros tengan sentido rápido, puedes subirlo a 1025 si quieres
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
        galeria.innerHTML = "<p style='grid-column: 1 / -1; text-align: center;'>No se encontraron resultados para tu filtro.</p>";
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

// --- LÓGICA DE FILTROS COMBINADOS ---
function aplicarFiltros() {
    const texto = inputBuscar.value.toLowerCase();
    const tipoSeleccionado = selectTipo.value;
    const regionSeleccionada = selectRegion.value;

    const filtrados = pokemonesGlobal.filter(poke => {
        // Filtro por nombre
        const coincideNombre = poke.name.toLowerCase().includes(texto);
        
        // Filtro por tipo
        const coincideTipo = tipoSeleccionado === "todos" || poke.types.some(t => t.type.name === tipoSeleccionado);
        
        // Filtro por región/categoría personalizada
        let coincideRegion = true;
        if (regionSeleccionada === "iniciales") {
            coincideRegion = [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(poke.id);
        } else if (regionSeleccionada === "legendarios") {
            coincideRegion = [144, 145, 146, 150, 151].includes(poke.id);
        }

        return coincideNombre && coincideTipo && coincideRegion;
    });

    mostrarPokemones(filtrados);
}

// Escuchamos los cambios en los 3 inputs para ejecutar el filtro
inputBuscar.addEventListener("input", aplicarFiltros);
selectTipo.addEventListener("change", aplicarFiltros);
selectRegion.addEventListener("change", aplicarFiltros);

btnCargar.addEventListener("click", cargarDatos);

// --- LÓGICA DEL MODAL CON PETICIÓN ASÍNCRONA EXTRA ---
window.abrirModal = async function(id) {
    const poke = pokemonesGlobal.find(p => p.id === id);
    if(!poke) return;

    modal.classList.replace("modal-oculto", "modal-visible");
    infoPokemon.innerHTML = "<p>Cargando datos clasificados...</p>";

    try {
        // Hacemos una petición extra para conseguir las debilidades del tipo principal
        const tipoPrincipal = poke.types[0].type.url;
        const resTipo = await fetch(tipoPrincipal);
        const dataTipo = await resTipo.json();
        
        // Extraemos de quién recibe el doble de daño
        const debilidades = dataTipo.damage_relations.double_damage_from.map(d => 
            `<span class="tipo tipo-${d.name}">${d.name}</span>`
        ).join('') || "Ninguna";

        const imgNormal = poke.sprites.other['official-artwork'].front_default || poke.sprites.front_default;
        
        infoPokemon.innerHTML = `
            <img src="${imgNormal}" alt="${poke.name}" style="width: 180px; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5));">
            <h2 style="text-transform: capitalize; color: #ffcc00; margin: 10px 0;">${poke.name}</h2>
            <div class="estadisticas">
                <p><strong>Nº Pokedex:</strong> ${poke.id}</p>
                <p><strong>Altura:</strong> ${(poke.height / 10).toFixed(1)} m</p>
                <p><strong>Peso:</strong> ${(poke.weight / 10).toFixed(1)} kg</p>
                <p><strong>Exp. Base:</strong> ${poke.base_experience}</p>
            </div>
            <div style="margin-top: 15px; text-align: center;">
                <p style="margin-bottom: 8px;"><strong>Recibe el doble de daño de:</strong></p>
                <div class="contenedor-tipos" style="flex-wrap: wrap;">
                    ${debilidades}
                </div>
            </div>
        `;
    } catch (error) {
        infoPokemon.innerHTML = "<p>Error al cargar el detalle.</p>";
    }
}

cerrarModal.addEventListener("click", () => {
    modal.classList.replace("modal-visible", "modal-oculto");
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.replace("modal-visible", "modal-oculto");
    }
});