let allHeroes = [];
let currentPage = 1;
let pageSize = 20;
let sortColumn = 'name';
let sortDirection = 'asc';

// List of all columns we need to show
const columns = [
    { key: 'icon', label: 'Icon', sortable: false },
    { key: 'name', label: 'Name' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'strength', label: 'Strength' },
    { key: 'speed', label: 'Speed' },
    { key: 'durability', label: 'Durability' },
    { key: 'power', label: 'Power' },
    { key: 'combat', label: 'Combat' },
    { key: 'race', label: 'Race' },
    { key: 'gender', label: 'Gender' },
    { key: 'height', label: 'Height' },
    { key: 'weight', label: 'Weight' },
    { key: 'placeOfBirth', label: 'Place of Birth' },
    { key: 'alignment', label: 'Alignment' }
];

// Get the text we should display in each cell
function getValue(hero, key) {
    if (key === 'icon') return hero.images?.xs || '';
    if (key === 'name') return hero.name || '-';
    if (key === 'fullName') return hero.biography?.fullName || '-';
    
    if (['intelligence','strength','speed','durability','power','combat'].includes(key)) {
        return hero.powerstats?.[key] ?? '-';
    }
    
    if (key === 'race') return hero.appearance?.race || '-';
    if (key === 'gender') return hero.appearance?.gender || '-';
    if (key === 'height') return hero.appearance?.height?.[1] || '-';
    if (key === 'weight') return hero.appearance?.weight?.[1] || '-';
    if (key === 'placeOfBirth') return hero.biography?.placeOfBirth || '-';
    if (key === 'alignment') return hero.biography?.alignment || '-';
    
    return '-';
}

// Simple way to turn height into number for sorting
function heightToCm(heightStr) {
    if (!heightStr || heightStr === '-' || heightStr === '0 cm') return null;
    
    const str = heightStr.toLowerCase();
    
    // Handle feet'inches format (like 6'8)
    if (str.includes("'")) {
        const parts = str.split("'");
        const feet = parseInt(parts[0]) || 0;
        const inches = parseInt(parts[1]) || 0;
        return Math.round(feet * 30.48 + inches * 2.54);
    }
    
    // Handle normal cm or m
    const num = parseFloat(str);
    if (isNaN(num)) return null;
    
    if (str.includes('m') && !str.includes('cm')) return Math.round(num * 100);
    return Math.round(num);
}

// Simple way to turn weight into number for sorting
function weightToKg(weightStr) {
    if (!weightStr || weightStr === '-' || weightStr === '0 kg') return null;
    
    const str = weightStr.toLowerCase();
    let num = parseFloat(str.replace(/[^0-9.]/g, ''));
    
    if (isNaN(num)) return null;
    
    if (str.includes('lb')) num *= 0.453592;
    if (str.includes('ton')) num *= 907.185;
    
    return Math.round(num);
};

// Get value + info for sorting (handles missing values nicely)
function getSortValue(hero, key) {
    const val = getValue(hero, key);
    if (val === '-') return { missing: true, value: null };

    if (key === 'height') {
        const cm = heightToCm(val);
        return { missing: cm === null, value: cm };
    }
    
    if (key === 'weight') {
        const kg = weightToKg(val);
        return { missing: kg === null, value: kg };
    }
    
    if (['intelligence','strength','speed','durability','power','combat'].includes(key)) {
        const num = Number(val);
        return { missing: isNaN(num) || num === 0, value: num };
    }
    
    // Normal text sorting
    return { missing: false, value: String(val).toLowerCase() };
}

// Build the table headers
function renderHeaders() {
    const row = document.getElementById('headerRow');
    row.innerHTML = '';
    
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        
        // Show sort direction arrow
        if (col.key === sortColumn) {
            th.innerHTML += sortDirection === 'asc' ? ' ▲' : ' ▼';
        }
        
        if (col.sortable !== false) {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => sortBy(col.key));
        }
        
        row.appendChild(th);
    });
}

// Fill the table with hero rows
function renderBody(heroes) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    heroes.forEach(hero => {
        const tr = document.createElement('tr');
        
        columns.forEach(col => {
            const td = document.createElement('td');
            
            if (col.key === 'icon') {
                const img = document.createElement('img');
                img.src = getValue(hero, 'icon');
                img.alt = getValue(hero, 'name');
                td.appendChild(img);
            } else {
                td.textContent = getValue(hero, col.key);
            }
            
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
}

// Update pagination buttons
function renderPagination(totalResults) {
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalResults / pageSize);
    
    const html = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="prevPage()"><i class="fas fa-chevron-left"></i></button>
        <span>${currentPage} / ${totalPages}</span>
        <button ${currentPage >= totalPages ? 'disabled' : ''} onclick="nextPage()"><i class="fas fa-chevron-right"></i></button>
    `;
    
    document.getElementById('headerPagination').innerHTML = html;
    document.getElementById('bottomPagination').innerHTML = html;
}

// Main function that updates everything
function render() {
    renderHeaders();
    
    const searchText = document.getElementById('search').value.toLowerCase().trim();
    
    // Filter heroes by name
    let filtered = allHeroes.filter(hero => 
        hero.name.toLowerCase().includes(searchText)
    );
    
    // Sort the filtered list
    filtered.sort((a, b) => {
        const sa = getSortValue(a, sortColumn);
        const sb = getSortValue(b, sortColumn);
        
        if (sa.missing !== sb.missing) return sa.missing ? 1 : -1;
        if (sa.value === sb.value) return 0;
        
        const dir = sortDirection === 'asc' ? 1 : -1;
        return (sa.value < sb.value ? -1 : 1) * dir;
    });
    
    // Apply pagination
    let paginated = filtered;
    if (pageSize !== 'all') {
        const start = (currentPage - 1) * pageSize;
        paginated = filtered.slice(start, start + pageSize);
    }
    
    renderBody(paginated);
    renderPagination(filtered.length);
}

// Handle column clicking for sorting
function sortBy(key) {
    if (sortColumn === key) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = key;
        sortDirection = 'asc';
    }
    currentPage = 1;
    render();
}

// Pagination controls
window.prevPage = () => {
    if (currentPage > 1) {
        currentPage--;
        render();
    }
};

window.nextPage = () => {
    const searchText = document.getElementById('search').value.toLowerCase().trim();
    const filteredLength = allHeroes.filter(hero => 
        hero.name.toLowerCase().includes(searchText)
    ).length;
    
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(filteredLength / pageSize);
    
    if (currentPage < totalPages) {
        currentPage++;
        render();
    }
};

// Event listeners
document.getElementById('search').addEventListener('input', () => {
    currentPage = 1;
    render();
});

document.getElementById('pageSize').addEventListener('change', e => {
    pageSize = e.target.value === 'all' ? 'all' : Number(e.target.value);
    currentPage = 1;
    render();
});

// Start the app
fetch('https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json')
    .then(res => res.json())
    .then(data => {
        allHeroes = data;
        render();
    })
    .catch(err => console.error('Failed to load heroes:', err));