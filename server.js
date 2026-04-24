// =======================
// IMPORTS
// =======================
require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");

// =======================
// INIT
// =======================
const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// FILE PATHS
// =======================
const PRODUCTS_FILE = path.join(__dirname, "data", "products.json");
const REPAIRS_FILE = path.join(__dirname, "data", "repairs.json");

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

// =======================
// AUTH (Basic Auth)
// =======================
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

function checkAuth(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth) {
        res.setHeader("WWW-Authenticate", "Basic");
        return res.status(401).send("Authentication required");
    }

    const [user, pass] = Buffer.from(auth.split(" ")[1], "base64")
        .toString()
        .split(":");

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        next();
    } else {
        res.setHeader("WWW-Authenticate", "Basic");
        res.status(401).send("Invalid credentials");
    }
}

// =======================
// ROUTES (PAGES)
// =======================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "admin.html"));
});

app.get("/admin-login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "admin-login.html"));
});

// =======================
// PRODUCTS API
// =======================

// GET PRODUCTS
app.get("/api/products", (req, res) => {
    try {
        const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));
        res.json(products);
    } catch (err) {
        console.log("❌ Error reading products:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

// ADD PRODUCT
app.post("/api/products", checkAuth, (req, res) => {
    try {
        const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));

        const newProduct = {
            id: Date.now().toString(),
            ...req.body
        };

        products.push(newProduct);

        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));

        res.send("Product Added");
    } catch (err) {
        res.status(500).send("Error adding product");
    }
});

// DELETE PRODUCT
app.delete("/api/products/:id", checkAuth, (req, res) => {
    try {
        let products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));

        products = products.filter(p => p.id !== req.params.id);

        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));

        res.send("Deleted");
    } catch (err) {
        res.status(500).send("Delete failed");
    }
});

// =======================
// REPAIRS API
// =======================

// ADD REPAIR
app.post("/api/repairs", checkAuth, (req, res) => {
    try {
        const repairs = JSON.parse(fs.readFileSync(REPAIRS_FILE));

        repairs.push(req.body);

        fs.writeFileSync(REPAIRS_FILE, JSON.stringify(repairs, null, 2));

        res.send("Repair Added");
    } catch (err) {
        res.status(500).send("Error adding repair");
    }
});

// GET REPAIRS
app.get("/api/repairs", checkAuth, (req, res) => {
    try {
        const repairs = JSON.parse(fs.readFileSync(REPAIRS_FILE));
        res.json(repairs);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

// TRACK REPAIR (PUBLIC)
app.get("/api/repair/:id", (req, res) => {
    try {
        const repairs = JSON.parse(fs.readFileSync(REPAIRS_FILE));

        const repair = repairs.find(r => r.id === req.params.id.toUpperCase());

        if (repair) res.json(repair);
        else res.status(404).send("Not Found");
    } catch (err) {
        res.status(500).send("Error");
    }
});

// DELETE REPAIR
app.delete("/api/repair/:id", checkAuth, (req, res) => {
    try {
        let repairs = JSON.parse(fs.readFileSync(REPAIRS_FILE));

        repairs = repairs.filter(r => r.id !== req.params.id);

        fs.writeFileSync(REPAIRS_FILE, JSON.stringify(repairs, null, 2));

        res.send("Deleted");
    } catch (err) {
        res.status(500).send("Delete failed");
    }
});

// =======================
// IMAGE UPLOAD (MULTER + SHARP)
// =======================
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.post("/api/upload", checkAuth, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file");

        const filename = Date.now() + ".jpg";

        await sharp(req.file.buffer)
            .resize(400, 400)
            .jpeg({ quality: 80 })
            .toFile(`public/uploads/${filename}`);

        res.json({ imageUrl: `/uploads/${filename}` });

    } catch (err) {
        console.log("❌ Upload error:", err);
        res.status(500).json({ error: "Image upload failed" });
    }
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});