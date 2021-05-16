const path = require("path");
const express = require("express");
const { type } = require("os");
const app = express();
const passport = require("passport");
require('./passport-setup'); 
const cookieSession = require("cookie-session");

const fs = require("fs");
const fsPromise = require("fs").promises;

app.set("views", "./pages");
app.set("view engine", "ejs");
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));

app.use(cookieSession({
  name: 'me-session',
  keys: ['key1', 'key2']
}));

let login = null;
let loginType = null;
const isLoggedIn = (req,res,next) =>{
  if(req.user){
    login = req.user.emails[0].value;
    if(login=="aakash013srivastava@gmail.com"){
     loginType = "admin";
    }
  }
  next();
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
  res.render("home", { login:login,loginType:loginType});
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
    loginType = null;
    res.render("home",{login:login,loginType:loginType});
  });
  

app.get("/about",isLoggedIn, (req, res) => {
  res.render("about", { login: login,loginType:loginType });
});

app.get("/products/:firm",isLoggedIn, (req, res) => {
  
  res.render("products", { login: login,loginType:loginType, firm: req.params.firm });
});

app.get("/orders",isLoggedIn, async (req, res) => {
  //check if current login user is registered  
  let userDetails = null;
    let orders =  await fsPromise.readFile('./pages/orders.txt',{encoding:'UTF-8'});
    let users =  await fsPromise.readFile('./pages/users.txt',{encoding:'UTF-8'});
    let rows = users.split("\n");
    for(let index in rows){
      let row = rows[index].split(",");
      if(login==row[2]){
        userDetails = row; // user is registered in users db,details sent to orders ejs
        console.log(userDetails);
      }
    }
    let OrderRows = orders.split("\n");
    //console.log(OrderRows);
    let eligibleOrders = [];
    for(let index in OrderRows){
      let row = OrderRows[index].split(",");
      //console.log(row);
        if(row[8]==login && loginType!="admin"){
          eligibleOrders[eligibleOrders.length] = OrderRows[index];
        }else if(loginType=="admin"){
          eligibleOrders[eligibleOrders.length] = OrderRows[index];
        }
    }
    //console.log(eligibleOrders);

    res.render("orders", { login: login,loginType:loginType,
                              userDetails:userDetails, orders: eligibleOrders });
    
    
});

app.post("/newUser",isLoggedIn, async (req, res) => {
  let users = await fsPromise.readFile('./pages/users.txt',{encoding:'UTF-8'});
  console.log(users.split("\n"));
  let userRows = users.split("\n");
  let newUserId  = null;
  for(let index in userRows){
      if(index==(userRows.length-1)){
        let row = userRows[index].split(","); // Retrieve Last registered user's id 
        newUserId = Number(row[0])+1;
        //console.log(row[0]);
      }
    }
  let phone = req.body.phone;
  let address = req.body.address;
  let writeUsers = await fsPromise.writeFile('./pages/users.txt',
                      ("\n,${newUserId},customer,${phone},${address}"),{encoding:'UTF-8'});
  res.render("home", { login: login,loginType:loginType });
  
});



app.get("/admin",isLoggedIn, async (req, res) => {
  let orders = await fsPromise.readFile('./pages/orders.txt',{encoding:'UTF-8'});
  res.render("admin", { login: login,loginType:loginType, orders: orders });
  
});


app.get("/*",isLoggedIn,(req,res)=>{
  res.status(404).render("404",{login:login,loginType:loginType});
});

app.listen(5000, (req, res) => {
  console.log("Server running on port 5000");
});
