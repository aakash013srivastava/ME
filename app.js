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
const isLoggedIn = (req,res,next) =>{
  if(req.user){
    login = req.user.emails[0].value;
    next();
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

app.get("/",isLoggedIn,(req, res) => {
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
  

app.get("/about",isLoggedIn, (req, res) => {
  console.log(String(req.user.email));
  res.render("about", { login: login });
});

app.get("/products/:firm",isLoggedIn, (req, res) => {
  
  res.render("products", { login: login, firm: req.params.firm });
});

app.get("/orders",isLoggedIn, (req, res) => {
  res.render("orders", { login: login, products: null });
});

app.get("/*",isLoggedIn,(req,res)=>{
  res.status(404).render("404",{login:login});
});

app.listen(5000, (req, res) => {
  console.log("Server running on port 5000");
});
