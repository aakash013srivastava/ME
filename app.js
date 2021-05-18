const path = require("path");
const express = require("express");
const { type } = require("os");
const app = express();
const passport = require("passport");
require('./passport-setup'); 
const cookieSession = require("cookie-session");
//const multer = require('multer');
const fs = require("fs");
const fsPromise = require("fs").promises;
const { setUncaughtExceptionCaptureCallback } = require("process");

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
  res.render("home", { login:login,loginType:loginType,message:null});
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
    res.render("home",{login:login,loginType:loginType,message:null});
  });
  

app.get("/about",isLoggedIn, (req, res) => {
  res.render("about", { login: login,loginType:loginType });
});


app.get("/orders",isLoggedIn, async (req, res) => {
  //check if current login user is registered  
  let userDetails = null;
    let orders =  await fsPromise.readFile('./pages/orders.txt',{encoding:'UTF-8'});
    let users =  await fsPromise.readFile('./pages/users.txt',{encoding:'UTF-8'});
    let rows = users.split("\n");
    for(let index in rows){
      let row = rows[index].split(",");
      //console.log(row[2]==login);
      if(login==row[2]){
        userDetails = row; // user is registered in users db,details sent to orders ejs
      //  console.log(userDetails);
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
    // Fetch product details to populate new order form fields
    let products = await fsPromise.readFile('./pages/products.txt',{encoding:'UTF-8'});
    res.render("orders", { login: login,loginType:loginType,
          userDetails:userDetails, orders: eligibleOrders,products:products });
});

app.post("/newOrder",isLoggedIn,async(req,res)=>{
  let orders = await fsPromise.readFile('./pages/orders.txt',{encoding:'UTF-8'});
  let newItemName = (req.body.selectItemName).split("-")[0];
  let newItemFirm = (req.body.selectItemName).split("-")[1];
  
  let newItemSize = req.body.selectItemSize;
  let newItemQuantity = req.body.newItemQuantity;
  // Fetching last order id
  let orderRows = orders.split("\n");
  let lastOrderRow =orderRows[orderRows.length-1];
  let lastOrderId = lastOrderRow.split(",")[0];
  let currentOrderId = Number(lastOrderId) + 1;
  // Fetching user details for current order
  let users =  await fsPromise.readFile('./pages/users.txt',{encoding:'UTF-8'});
  let userDetails = null;
    let rows = users.split("\n");
    for(let index in rows){
      let row = rows[index].split(",");
      if(login==row[2]){
        userDetails = row; // user is registered in users db,details sent to orders ejs
        //console.log(userDetails);
      }
    }
    let userEmail= userDetails[2];
    let userPhone= userDetails[3];
    let userAddress= userDetails[4];
    // fetching product prices for order and billing
    let products =  await fsPromise.readFile('./pages/products.txt',{encoding:'UTF-8'});
    let productRows = products.split("\n");
    let newItemPrice = null;
    for(let index in productRows){
      let row =  productRows[index].split(",");
      //console.log(row);
      if(row[1]==newItemName && row[2]==newItemFirm && row[3]==newItemSize){
        newItemPrice = row[4];
        //console.log(newItemPrice);
      }
    }
    let newItemBill = newItemPrice*newItemQuantity;
    //Get order date
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    let orderDate = dd + '/' + mm + '/' + yyyy;
    // Writing current order to orders database
    let writeOrders = fsPromise.appendFile("./pages/orders.txt",
    ("\n"+currentOrderId+","+newItemName+","+newItemFirm+","+newItemSize+","
    +newItemPrice+","+newItemQuantity+","+newItemBill+","+orderDate+","+userEmail+","+userPhone+","+userAddress),
    {encoding:'UTF-8'});
  res.redirect("/orders");
});

app.post("/newUser",isLoggedIn, async (req, res) => {
  let users = await fsPromise.readFile('./pages/users.txt',{encoding:'UTF-8'});
  //console.log(users.split("\n"));
  let userRows = users.split("\n"); //  1 user detail each in every array index
  let newUserId  = null;
  for(let index in userRows){
      if(index==(userRows.length-1)){
        let row = userRows[index].split(","); // Retrieve Last registered user's id 
        newUserId = Number(row[0])+1;  //Make current id one more than last user id
        //console.log(row[0]);
      }
    }
  let phone = req.body.phone;
  let address = req.body.address;
  let writeUsers = await fsPromise.appendFile('./pages/users.txt',
                      ("\n"+newUserId+",customer,"+login+","+phone+","+address),{encoding:'UTF-8'});
  res.render("home", { login: login,loginType:loginType,message:"User Registered !!!" });
  
});



app.get("/admin",isLoggedIn, async (req, res) => {
  let orders = await fsPromise.readFile('./pages/orders.txt',{encoding:'UTF-8'});
  res.render("admin", { login: login,loginType:loginType, orders: orders });
  
});

app.get("/products/:firm",isLoggedIn, async(req, res) => {
  let products = await fsPromise.readFile('./pages/products.txt',{encoding:'UTF-8'});
    let productRows = products.split("\n");
    let eligibleProducts = "\n";
    for(let index in productRows){
      let row = productRows[index].split(",");
      //console.log(row);
        if(row[2]==req.params.firm){
          eligibleProducts+= productRows[index]+"\n";
        }
    }
  res.render("products",{login: login,loginType:loginType,products:eligibleProducts});
});

app.post("/editProduct",isLoggedIn, async (req, res) => {
  let products = await fsPromise.readFile('./pages/products.txt',{encoding:'UTF-8'});
  //console.log(users.split("\n"));
  let productRows = products.split("\n"); //  1 product detail each in every array index
  let productExists  = false;
  let lastProductId = null;
  let newProductSpecs = null;
  for(let index in productRows){
    let row =  productRows[index].split(","); // Array of one specific product details
    if(row[1]==(req.body.itemname).toLowerCase() && row[2]==req.body.firm && row[3]==req.body.size){ // check if product+firm exists in db
      productExists =true;// check if product line exists,to update row
      newProductSpecs =products.replace(row,(row[0]+","+(req.body.itemname).toLowerCase()+","+req.body.firm+","+req.body.size+","
      +req.body.price+","+req.body.quantity));
      let writeProduct = await fsPromise.writeFile('./pages/products.txt',newProductSpecs,{encoding:'UTF-8'});    
      }else{
        lastProductId = productRows.length-1;
      }
    }
    if(!productExists){// product line doesnt exist,append row at the end
      let writeProduct = await fsPromise.appendFile('./pages/products.txt',
      ("\n"+(lastProductId+1)+","+(req.body.itemname).toLowerCase()+","+req.body.firm+","+req.body.size+","
      +req.body.price+","+req.body.quantity),{encoding:'UTF-8'});    
    }
    let newProducts = await fsPromise.readFile('./pages/products.txt',{encoding:'UTF-8'});
  res.render("products", { login: login,loginType:loginType,products:newProducts });
  
  
});



app.get("/*",isLoggedIn,(req,res)=>{
  res.status(404).render("404",{login:login,loginType:loginType});
});

app.listen(5000, (req, res) => {
  console.log("Server running on port 5000");
});
