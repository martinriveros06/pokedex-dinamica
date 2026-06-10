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
        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025"); // Usaremos 151 para que los filtros tengan sentido rápido, puedes subirlo a 1025 si quieres
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
        
        // Filtro por región (usando los rangos de la PokéDex Nacional)
        let coincideRegion = true;
        if (regionSeleccionada === "kanto") coincideRegion = poke.id >= 1 && poke.id <= 151;
        else if (regionSeleccionada === "johto") coincideRegion = poke.id >= 152 && poke.id <= 251;
        else if (regionSeleccionada === "hoenn") coincideRegion = poke.id >= 252 && poke.id <= 386;
        else if (regionSeleccionada === "sinnoh") coincideRegion = poke.id >= 387 && poke.id <= 493;
        else if (regionSeleccionada === "unova") coincideRegion = poke.id >= 494 && poke.id <= 649;
        else if (regionSeleccionada === "kalos") coincideRegion = poke.id >= 650 && poke.id <= 721;
        else if (regionSeleccionada === "alola") coincideRegion = poke.id >= 722 && poke.id <= 809;
        else if (regionSeleccionada === "galar") coincideRegion = poke.id >= 810 && poke.id <= 898;
        else if (regionSeleccionada === "paldea") coincideRegion = poke.id >= 906 && poke.id <= 1025;

        return coincideNombre && coincideTipo && coincideRegion;
    });

    mostrarPokemones(filtrados);
}

// Escuchamos los cambios en los 3 inputs para ejecutar el filtro
inputBuscar.addEventListener("input", aplicarFiltros);
selectTipo.addEventListener("change", aplicarFiltros);
selectRegion.addEventListener("change", aplicarFiltros);

btnCargar.addEventListener("click", cargarDatos);

// --- LÓGICA DEL MODAL CON PETICIONES DE DATOS AVANZADOS ---
window.abrirModal = async function(id) {
    const poke = pokemonesGlobal.find(p => p.id === id);
    if(!poke) return;

    modal.classList.replace("modal-oculto", "modal-visible");
    
    // Plantilla inicial mientras cargan los datos
    infoPokemon.innerHTML = `
        <div class="luces-pokedex">
            <div class="luz-principal"></div>
            <div class="luz-pequena luz-roja"></div>
            <div class="luz-pequena luz-amarilla"></div>
            <div class="luz-pequena luz-verde"></div>
        </div>
        <div class="pokedex-pantalla">
            <div class="pantalla-interior" style="text-align: center;">
                <p>Cargando base de datos nacional...</p>
            </div>
        </div>
    `;

    try {
        // 1. Petición para debilidades y fortalezas
        const tipoPrincipal = poke.types[0].type.url;
        const resTipo = await fetch(tipoPrincipal);
        const dataTipo = await resTipo.json();
        
        const debilidades = dataTipo.damage_relations.double_damage_from.map(d => 
            `<span class="tipo tipo-${d.name}">${d.name}</span>`
        ).join('') || "Ninguna";

        const fortalezas = dataTipo.damage_relations.double_damage_to.map(d => 
            `<span class="tipo tipo-${d.name}">${d.name}</span>`
        ).join('') || "Ninguna";

        // 2. Petición a la "especie" para género, hábitat y texto de la Pokédex
        const resEspecie = await fetch(poke.species.url);
        const dataEspecie = await resEspecie.json();

        // Cálculo del género basado en la tasa de la API (es un valor de 0 a 8)
        let generoTexto = "Desconocido";
        if (dataEspecie.gender_rate === -1) {
            generoTexto = "Sin género / Asexuado";
        } else {
            const hembra = (dataEspecie.gender_rate / 8) * 100;
            const macho = 100 - hembra;
            generoTexto = `♂ ${macho}% / ♀ ${hembra}%`;
        }

        // Hábitat
        const habitatTexto = dataEspecie.habitat ? dataEspecie.habitat.name : "Datos borrados";

        // Obtener descripción oficial en español
        const entradaEspanol = dataEspecie.flavor_text_entries.find(entry => entry.language.name === 'es');
        const descripcion = entradaEspanol ? entradaEspanol.flavor_text.replace(/\n|\f/g, ' ') : "No hay registros disponibles de este Pokémon en español.";

        const imgNormal = poke.sprites.other['official-artwork'].front_default || poke.sprites.front_default;
        
        // Inyectamos todo en el diseño final de la Pokédex
        infoPokemon.innerHTML = `
            <div class="luces-pokedex">
                <div class="luz-principal"></div>
                <div class="luz-pequena luz-roja"></div>
                <div class="luz-pequena luz-amarilla"></div>
                <div class="luz-pequena luz-verde"></div>
            </div>
            
            <div class="pokedex-pantalla">
                <div class="pantalla-interior">
                    <img src="${imgNormal}" alt="${poke.name}">
                    <h2 style="text-transform: uppercase; text-align: center; margin: 5px 0;">#${poke.id} ${poke.name}</h2>
                    
                    <div class="datos-texto">
                        <p style="font-style: italic; border-bottom: 2px dashed #555; padding-bottom: 8px;">"${descripcion}"</p>
                        <p><strong>Hábitat:</strong> <span style="text-transform: capitalize;">${habitatTexto}</span></p>
                        <p><strong>Prob. Género:</strong> ${generoTexto}</p>
                        <p><strong>Altura:</strong> ${(poke.height / 10).toFixed(1)}m | <strong>Peso:</strong> ${(poke.weight / 10).toFixed(1)}kg</p>
                        
                        <div style="margin-top: 15px;">
                            <p style="margin-bottom: 5px; font-weight: bold;">Super Efectivo vs (Daño 2x):</p>
                            <div class="contenedor-tipos" style="justify-content: flex-start; flex-wrap: wrap;">${fortalezas}</div>
                        </div>

                        <div style="margin-top: 10px;">
                            <p style="margin-bottom: 5px; font-weight: bold;">Cuidado! Débil contra:</p>
                            <div class="contenedor-tipos" style="justify-content: flex-start; flex-wrap: wrap;">${debilidades}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        infoPokemon.querySelector('.pantalla-interior').innerHTML = "<p>Error de conexión con el sistema central de Oak.</p>";
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