const path = require("path");
const express = require("express");
const app = express();

app.set("views", "./pages");
app.set("view engine", "ejs");
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));

app.use(
  "/css",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/css"))
);
app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"))
);
app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules/jquery/dist"))
);

app.get("/", (req, res) => {
  res.render("home", { login: null });
});

app.get("/about", (req, res) => {
  res.render("about", { login: null });
});

app.get("/products/ne", (req, res) => {
  res.render("products", { login: null, products: null });
});

app.get("/products/ml", (req, res) => {
  res.render("products", { login: null, products: null });
});

app.get("/products/ribw", (req, res) => {
  res.render("products", { login: null, products: null });
});

app.get("/orders", (req, res) => {
  res.render("products", { login: null, products: null });
});

app.listen(5000, (req, res) => {
  console.log("Server running on port 5000");
});
