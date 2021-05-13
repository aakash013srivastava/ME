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

let login = null;

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

app.get("/",(req, res) => {
  if(req.user){
    login = req.user._json.email;
  }
  res.render("home", { login:login,message:"Logged In" });
});


app.get('/login',
  /*passport.authenticate('google', { scope: ['profile','email'] }));*/
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/failed' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/logout',(req,res) => {
    req.session = null;
    req.logout();
    login = null;
    res.render("home",{login:login});
  })
  

app.get("/about", (req, res) => {
  console.log(String(req.user.email));
  res.render("about", { login: login });
});

app.get("/products/:firm", (req, res) => {
  
  res.render("products", { login: login, firm: req.params.firm });
});

app.get("/orders", (req, res) => {
  res.render("orders", { login: login, products: null });
});

app.get("/*",(req,res)=>{
  res.status(404).render("404",{login:login});
});

app.listen(5000, (req, res) => {
  console.log("Server running on port 5000");
});
