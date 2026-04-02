// Données initiales
let stockItems = [
    { id: "id1", name: "Ramettes A4 80g", category: "Papeterie", quantity: 45, price: 6.5 },
    { id: "id2", name: "Toner Noir Xerox", category: "Consommable", quantity: 8, price: 49.9 },
    { id: "id3", name: "Souris sans fil Logitech", category: "Informatique", quantity: 12, price: 22.9 },
    { id: "id4", name: "Fauteuil de bureau ergo", category: "Mobilier", quantity: 3, price: 189.0 },
    { id: "id5", name: "Bloc-notes A5", category: "Papeterie", quantity: 120, price: 1.2 }
];

// Variables d'édition
let editMode = false;
let currentEditId = null;

// Éléments DOM
const tableBody = document.getElementById("tableBody");
const productNameInput = document.getElementById("productName");
const productCategorySelect = document.getElementById("productCategory");
const productQuantityInput = document.getElementById("productQuantity");
const productPriceInput = document.getElementById("productPrice");
const saveBtn = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formModeText = document.getElementById("formModeText");
const formIcon = document.getElementById("formIcon");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const statsBadge = document.getElementById("statsBadge");

// Générer un ID unique
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

// Sauvegarde dans localStorage
function saveToLocalStorage() {
    localStorage.setItem("bureauStockApp", JSON.stringify(stockItems));
}

// Chargement depuis localStorage
function loadFromLocalStorage() {
    const stored = localStorage.getItem("bureauStockApp");
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                stockItems = parsed;
            }
        } catch(e) { 
            console.warn(e); 
        }
    }
}

// Mettre à jour les statistiques
function updateStats() {
    const totalQuantity = stockItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    statsBadge.innerHTML = `📦 ${totalQuantity} unités · 💰 ${totalValue.toFixed(2)} €`;
}

// Statut du stock selon quantité
function getStockStatus(quantity) {
    if (quantity <= 0) return { label: "RUPTURE", class: "stock-low" };
    if (quantity < 5) return { label: "⚠️ Faible", class: "stock-low" };
    if (quantity < 20) return { label: "✔️ Modéré", class: "stock-medium" };
    return { label: "✅ Stock OK", class: "stock-high" };
}

// Échapper les caractères HTML
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Afficher le tableau avec filtres
function renderTable() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    let filtered = [...stockItems];
    
    // Filtre par catégorie
    if (selectedCategory !== "all") {
        filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Filtre par recherche
    if (searchTerm !== "") {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm) || 
            item.category.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr class="empty-row"><td colspan="7">📭 Aucun matériel trouvé. Modifiez les filtres ou ajoutez un article.</td></tr>`;
        updateStats();
        return;
    }
    
    let html = "";
    for (let item of filtered) {
        const totalValue = (item.quantity * item.price).toFixed(2);
        const status = getStockStatus(item.quantity);
        html += `
            <tr>
                <td style="font-weight:500;">${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.category)}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toFixed(2)} €</td>
                <td>${totalValue} €</td>
                <td><span class="badge-stock ${status.class}">${status.label}</span></td>
                <td class="action-icons">
                    <button class="edit-btn" data-id="${item.id}" title="Modifier">✏️</button>
                    <button class="delete-btn" data-id="${item.id}" title="Supprimer">🗑️</button>
                </td>
            </tr>
        `;
    }
    tableBody.innerHTML = html;
    
    // Attacher les événements aux boutons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            startEditMode(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            deleteItemById(id);
        });
    });
    
    updateStats();
}

// Ajouter ou modifier un article
function saveProduct() {
    const name = productNameInput.value.trim();
    const category = productCategorySelect.value;
    let quantity = parseInt(productQuantityInput.value, 10);
    let price = parseFloat(productPriceInput.value);
    
    // Validations
    if (name === "") {
        alert("Veuillez saisir le nom du matériel.");
        return;
    }
    if (isNaN(quantity) || quantity < 0) quantity = 0;
    if (isNaN(price) || price < 0) price = 0;
    
    if (editMode && currentEditId) {
        // Mode édition
        const index = stockItems.findIndex(item => item.id === currentEditId);
        if (index !== -1) {
            stockItems[index] = {
                ...stockItems[index],
                name: name,
                category: category,
                quantity: quantity,
                price: price
            };
        }
        resetForm();
        renderTable();
        saveToLocalStorage();
        alert("Article modifié avec succès !");
    } else {
        // Mode ajout
        const newItem = {
            id: generateId(),
            name: name,
            category: category,
            quantity: quantity,
            price: price
        };
        stockItems.unshift(newItem);
        resetForm();
        renderTable();
        saveToLocalStorage();
        alert(`"${name}" ajouté au stock.`);
    }
}

// Supprimer un article
function deleteItemById(id) {
    const item = stockItems.find(i => i.id === id);
    if (!item) return;
    if (confirm(`Supprimer définitivement "${item.name}" ?`)) {
        stockItems = stockItems.filter(item => item.id !== id);
        if (editMode && currentEditId === id) {
            resetForm();
        }
        renderTable();
        saveToLocalStorage();
    }
}

// Activer le mode édition
function startEditMode(id) {
    const item = stockItems.find(i => i.id === id);
    if (!item) return;
    
    editMode = true;
    currentEditId = id;
    
    productNameInput.value = item.name;
    productCategorySelect.value = item.category;
    productQuantityInput.value = item.quantity;
    productPriceInput.value = item.price;
    
    formModeText.innerHTML = "Modifier l'article";
    formIcon.innerHTML = "✏️";
    cancelEditBtn.style.display = "inline-flex";
    saveBtn.textContent = "✏️ Mettre à jour";
    
    // Scroll vers le formulaire
    document.querySelector(".card-form").scrollIntoView({ behavior: "smooth", block: "center" });
}

// Réinitialiser le formulaire
function resetForm() {
    editMode = false;
    currentEditId = null;
    productNameInput.value = "";
    productCategorySelect.value = "Papeterie";
    productQuantityInput.value = 1;
    productPriceInput.value = 0.00;
    formModeText.innerHTML = "Ajouter un article";
    formIcon.innerHTML = "➕";
    cancelEditBtn.style.display = "none";
    saveBtn.textContent = "💾 Enregistrer l'article";
}

// Réinitialiser les filtres
function resetFilters() {
    searchInput.value = "";
    categoryFilter.value = "all";
    renderTable();
}

// Initialisation
function init() {
    loadFromLocalStorage();
    
    // Vérifier si le stock est vide après chargement
    if (!stockItems || stockItems.length === 0) {
        stockItems = [
            { id: "id1", name: "Ramettes A4 80g", category: "Papeterie", quantity: 45, price: 6.5 },
            { id: "id2", name: "Toner Noir Xerox", category: "Consommable", quantity: 8, price: 49.9 },
            { id: "id3", name: "Souris sans fil Logitech", category: "Informatique", quantity: 12, price: 22.9 },
            { id: "id4", name: "Fauteuil de bureau ergo", category: "Mobilier", quantity: 3, price: 189.0 },
            { id: "id5", name: "Bloc-notes A5", category: "Papeterie", quantity: 120, price: 1.2 }
        ];
        saveToLocalStorage();
    }
    
    renderTable();
    
    // Événements
    saveBtn.addEventListener("click", saveProduct);
    cancelEditBtn.addEventListener("click", resetForm);
    searchInput.addEventListener("input", () => renderTable());
    categoryFilter.addEventListener("change", () => renderTable());
    clearFiltersBtn.addEventListener("click", resetFilters);
}

// Sauvegarde avant de quitter
window.addEventListener("beforeunload", () => {
    saveToLocalStorage();
});

// Démarrer l'application
init();