// Nuvus Store - Configuración, Tema y Sincronización

const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhxIYBzKuPzoLSEck-QgIvzSHr_UJFEzJ4X4Q0Qxu3RV88IV-IMNUeZTd-c58qVXtm6WitWeHint2V/pub?gid=0&single=true&output=csv";
const WHATSAPP_NUMBER = "5493513520444";

const DEFAULT_PRODUCTS = [
    {
        modelo: "iPhone 16 Pro",
        estado: "Nuevo",
        almacenamiento: "256 GB",
        color: "Titanium",
        bateria: "100%",
        precio: "$900.000",
        imagen: "https://i.postimg.cc/9Qvqmzr7/iphone-16.jpg",
        stock: "En Stock"
    }
];

let allProducts = [...DEFAULT_PRODUCTS];
let currentFilter = 'todos';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    const footerBtn = document.getElementById('footerWaBtn');
    if (footerBtn) {
        footerBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola Nuvus Store, me gustaría consultar por el catálogo de celulares.')}`;
    }

    if (GOOGLE_SHEETS_CSV_URL && GOOGLE_SHEETS_CSV_URL.includes("output=csv")) {
        fetchCsvData(GOOGLE_SHEETS_CSV_URL);
    } else {
        renderProducts();
    }

    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderProducts();
    });
});

function initTheme() {
    const savedTheme = localStorage.getItem('nuvus_theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        updateThemeIcon(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcon(false);
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('nuvus_theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (isDark) {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>`;
    } else {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`;
    }
}

async function fetchCsvData(url) {
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        allProducts = parseCsv(csvText);
        renderProducts();
    } catch (error) {
        console.error("Error al sincronizar con Google Drive:", error);
        allProducts = [...DEFAULT_PRODUCTS];
        renderProducts();
    }
}

function parseCsv(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return DEFAULT_PRODUCTS;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        let item = {};
        headers.forEach((h, index) => {
            item[h] = values[index] || '';
        });
        return {
            modelo: item.modelo || 'Teléfono',
            estado: item.estado || 'Usado',
            almacenamiento: item.almacenamiento || item['memoria'] || '',
            color: item.color || '',
            bateria: item.bateria || item['batería'] || '',
            precio: item.precio || 'Consultar',
            imagen: (item.imagen && item.imagen.startsWith('http')) ? item.imagen : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
            stock: item.stock || 'En Stock'
        };
    });
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = 'filter-btn text-xs px-4 py-2 rounded-xl font-medium transition bg-white dark:bg-darkbrand-bg text-brand-muted dark:text-darkbrand-muted hover:text-brand-text dark:hover:text-darkbrand-text border border-brand-border dark:border-darkbrand-border';
    });
    const activeBtn = document.getElementById(`btn-filter-${filter}`);
    if (activeBtn) {
        activeBtn.className = 'filter-btn text-xs px-4 py-2 rounded-xl font-medium transition bg-brand-text dark:bg-darkbrand-text text-brand-bg dark:text-darkbrand-bg shadow-sm';
    }
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    if (!grid) return;
    
    grid.innerHTML = '';

    const filtered = allProducts.filter(p => {
        const matchesSearch = 
            (p.modelo && p.modelo.toLowerCase().includes(searchQuery)) ||
            (p.color && p.color.toLowerCase().includes(searchQuery)) ||
            (p.almacenamiento && p.almacenamiento.toLowerCase().includes(searchQuery));
        
        let matchesFilter = true;
        if (currentFilter === 'nuevo') matchesFilter = p.estado.toLowerCase().includes('nuevo');
        else if (currentFilter === 'usado') matchesFilter = p.estado.toLowerCase().includes('usado');

        return matchesSearch && matchesFilter;
    });

    const statTotal = document.getElementById('statTotal');
    const statUsed = document.getElementById('statUsed');
    if (statTotal) statTotal.innerText = filtered.length;
    if (statUsed) statUsed.innerText = filtered.filter(p => p.estado.toLowerCase().includes('usado')).length;

    if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    } else {
        if (emptyState) emptyState.classList.add('hidden');
    }

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = "product-card bg-brand-card dark:bg-darkbrand-card border border-brand-border dark:border-darkbrand-border rounded-[24px] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all";
        
        const encodedMsg = encodeURIComponent(`¡Hola Nuvus Store! Me interesa consultar por el ${p.modelo} (${p.color} - ${p.almacenamiento}) publicado a ${p.precio}.`);
        const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;

        card.innerHTML = `
            <!-- SECCIÓN SUPERIOR OSCURA -->
            <div class="relative w-full h-52 bg-[#1A1A1A] overflow-hidden flex items-center justify-center p-4">
                <div class="absolute top-3 left-3 bg-white/95 text-brand-text px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>${p.stock || 'En Stock'}</span>
                </div>

                <div class="absolute top-3 right-3 bg-black/80 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">
                    ${p.estado}
                </div>

                <img src="${p.imagen}" alt="${p.modelo}" class="object-contain h-full w-full" onerror="this.src='https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'">
            </div>

            <!-- SECCIÓN INFERIOR -->
            <div class="p-5 flex flex-col justify-between space-y-4 bg-brand-card dark:bg-darkbrand-card transition-colors">
                <h3 class="font-extrabold text-xl text-brand-text dark:text-darkbrand-text tracking-tight">${p.modelo}</h3>

                <div class="grid grid-cols-3 border-y border-brand-border dark:border-darkbrand-border py-2.5 text-center">
                    <div class="border-r border-brand-border dark:border-darkbrand-border pr-2">
                        <span class="block text-[10px] font-bold text-brand-muted dark:text-darkbrand-muted uppercase tracking-wider">Memoria</span>
                        <span class="text-sm font-extrabold text-brand-text dark:text-darkbrand-text">${p.almacenamiento || '-'}</span>
                    </div>
                    <div class="px-2">
                        <span class="block text-[10px] font-bold text-brand-muted dark:text-darkbrand-muted uppercase tracking-wider">Color</span>
                        <span class="text-sm font-bold text-brand-text dark:text-darkbrand-text truncate block">${p.color || '-'}</span>
                    </div>
                    <div class="border-l border-brand-border dark:border-darkbrand-border pl-2">
                        <span class="block text-[10px] font-bold text-brand-muted dark:text-darkbrand-muted uppercase tracking-wider">Batería</span>
                        <span class="text-sm font-extrabold text-[#0F9D58]">${p.bateria || '100%'}</span>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-1">
                    <div>
                        <span class="text-[9px] font-extrabold text-brand-muted dark:text-darkbrand-muted uppercase tracking-wider block">Precio Ef / Transf</span>
                        <span class="text-2xl font-black text-brand-text dark:text-darkbrand-text tracking-tight">${p.precio}</span>
                    </div>

                    <a href="${waLink}" target="_blank" class="bg-[#121212] dark:bg-white text-white dark:text-black hover:opacity-90 px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all transform active:scale-95">
                        <svg class="w-4 h-4 fill-current text-[#25D366]" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        <span>Pedir</span>
                    </a>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}