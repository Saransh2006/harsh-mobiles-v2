// =======================
// SELECT ELEMENTS
// =======================
const mobilesBtn = document.getElementById("mobilesBtn");
const electronicsBtn = document.getElementById("electronicsBtn");
const productContainer = document.getElementById("productContainer");

let allProducts = [];


// =======================
// RENDER PRODUCTS
// =======================

function renderProducts(data) {

    if(data.length === 0){
        productContainer.innerHTML = "<p>No products available</p>";
        return;
    }

    let html = "";

    data.forEach(product => {

        html += `
        <div class="card fade-up">

            <div class="image-box">
                <img src="${product.image}" alt="${product.name}">
                <span class="badge">In Stock</span>
            </div>

            <h3>${product.name}</h3>

            <ul>
                ${(product.features || []).map(f => `<li>${f}</li>`).join("")}
            </ul>

            <div class="bottom-row">
                <span class="price">₹${product.price}</span>
                <button class="view-btn">View</button>
            </div>

        </div>
        `;
    });

    productContainer.innerHTML = html;
}


// =======================
// LOAD DATA
// =======================

async function loadProducts(){

    try {
        const res = await fetch("/api/products");

        if(!res.ok){
            throw new Error("Server error");
        }

        const data = await res.json();

        console.log("PRODUCTS:", data);

        allProducts = data;

        // default load = mobiles
        filterProducts("mobiles");

    } catch (err) {
        console.log("FRONTEND ERROR:", err);
        productContainer.innerHTML = "Failed to load products";
    }
}


// =======================
// FILTER PRODUCTS
// =======================

function filterProducts(category){

    const filtered = allProducts.filter(p => p.category === category);

    renderProducts(filtered);
}


// =======================
// BUTTON EVENTS
// =======================

mobilesBtn.addEventListener("click", () => {

    mobilesBtn.classList.add("active");
    electronicsBtn.classList.remove("active");

    document.querySelector(".toggle").classList.remove("active-right");

    filterProducts("mobiles");
});

electronicsBtn.addEventListener("click", () => {

    electronicsBtn.classList.add("active");
    mobilesBtn.classList.remove("active");

    document.querySelector(".toggle").classList.add("active-right");

    filterProducts("electronics");
});


// =======================
// INITIAL LOAD
// =======================
loadProducts();


// =======================
// REPAIR TRACKING
// =======================

async function trackRepair() {

    console.log("TRACK CLICKED");

    const input = document.getElementById("repairId");
    const resultDiv = document.getElementById("repairResult");

    if(!input || !resultDiv){
        console.log("Missing elements");
        return;
    }

    const id = input.value.trim().toUpperCase();

    if(!id){
        resultDiv.innerHTML = `<p class="repair-error">Enter Repair ID</p>`;
        return;
    }

    try{
        const res = await fetch(`/api/repair/${id}`);

        if(!res.ok){
            resultDiv.innerHTML = `<p class="repair-error">Repair not found</p>`;
            return;
        }

        const data = await res.json();

        resultDiv.innerHTML = `
        <div class="repair-card">
            <h3>Repair Details</h3>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Device:</strong> ${data.device}</p>
            <span class="status ${data.status.toLowerCase()}">${data.status}</span>
        </div>
        `;

    }catch(err){
        console.log(err);
        resultDiv.innerHTML = `<p class="repair-error">Server error</p>`;
    }
}