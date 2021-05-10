const path = require("path");
const express = require("express");
const { type } = require("os");
const app = express();
const passport = require("passport");
require('./passport-setup'); 
const cookieSession = require("cookie-session");

app.set("views", "./pages");
app.set("view engine", "ejs");
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));

app.use(cookieSession({
  name: 'me-session',
  keys: ['key1', 'key2']
}));

const isLoggedIn = (req,res,next) => {
  if(req.user){
    next();
  }else{
    res.sendStatus(401);
  }
}

app.use(passport.initialize());
app.use(passport.session());

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

app.get("/failed", (req, res) => {
  res.render("login", { message: "Failed to login" });
});

app.get("/good",isLoggedIn, (req, res) => {
  res.render("login", { message: "Welcome Mr. ${req.user.email}" });
});

app.get('/login',
  passport.authenticate('google', { scope: ['profile','email'] }));

app.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/failed' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });


app.get("/about", (req, res) => {
  res.render("about", { login: null });
});

app.get("/products/:firm", (req, res) => {
  console.log(req.params.firm);
  res.render("products", { login: null, firm: req.params.firm });
});

app.get("/orders", (req, res) => {
  res.render("products", { login: null, products: null });
});

app.get('/logout',(req,res) => {
  req.session = null;
  req.logout();
  res.redirect("/");
})

app.listen(5000, (req, res) => {
  console.log("Server running on port 5000");
});
