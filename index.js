const express = require('express'); // Install request (jquery for node)
const app = express();  // Establish the express app
var request = require('request'); // Library for making API calls
var bodyParser = require('body-parser'); // For decoding JSON
var path = require('path');
// Set up our server
if (app.get('env') === 'development') {
  require('dotenv').config();
  var port = 3000;
} else {
  var port = process.env.PORT;
};

// Our private app credentials
const API_KEY = process.env.API_KEY;
const PASSWORD = process.env.PASSWORD;
const SHOPURL = "bitossi.myshopify.com";
const VARIANTID = 19568251764758; // The variant ID that we want to update

// 1. Get specific variant
function getAllProducts(callback) {
  // Important thing here - we're using our API keys to request /products.json
  var requestURL = "https://" + API_KEY+ ":" + PASSWORD+ "@" + SHOPURL + "/admin/api/2019-07/products.json";

  request({
    url: requestURL,
    method: "GET",
    dataType: "json"
  }, function(err, resp) {
    if (err) {
      console.log(err)
    } else {
      callback(resp["body"]);
    }
  });

};

// 2. Get specific variant
function getVariant(variantID, callback) {
  // Important thing here - we're using our API keys to request /products.json
  var requestURL = "https://" + API_KEY+ ":" + PASSWORD+ "@" + SHOPURL + "/admin/api/2019-07/variants/" + variantID + ".json";

  request({
    url: requestURL,
    method: "GET",
    dataType: "json"
  }, function(err, resp) {
    if (err) {
      console.log(err)
    } else {
      console.log(resp["body"]);
      // callback(resp["body"]);
    }
  });
};

// 3. Get ISS Position
function getISSPosition(callback) {
  // Make a request to coinmarketcap for bitcoin
  request({
    url : "http://api.open-notify.org/iss-now.json",
    method: "GET",
    dataType: "json"
  }, function(err, resp) {
    if (err) {
      console.log(err);
    } else {
      var data = JSON.parse(resp["body"]);
      callback(data);
    }
  });

};

// 4. Update the variant price
function updateVariantPrice(variantID, price, callback) {
  // Important thing here - we're using our API keys to request /products.json
  var requestURL = "https://" + API_KEY+ ":" + PASSWORD+ "@" + SHOPURL + "/admin/api/2019-07/variants/" + variantID + ".json"

  request({
    url: requestURL,
    method: "PUT",  // Different type of request
    json: {
      "variant" : {
        "id" : variantID,
        "price" : price
      }
    },
    dataType: "json"
  }, function(err, resp) {
    if (err) {
      console.log(err)
    } else {
      callback(resp["body"]);
    }
  });
};

// Bring it all together - update variant price with ISS
function updatePriceWithISSPosition(variantID, callback) {
  getISSPosition(function(data){
    var priceArray = data.iss_position.longitude.split(".");
    var price = priceArray[0] + "." + priceArray[1].substring(0,2);
    if (price < 0) {price = (price * -1)}; // Handle negative longitude
    updateVariantPrice(VARIANTID, price, function(d) {
      console.log("New Price is " + price);
      callback(d);
    });
  });
};


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.post('/', function(req, res) {
  console.log("recieved");
  updatePriceWithISSPosition(VARIANTID, function(data) {
    res.send(data.variant.price);
  })
});



app.listen(port, function() {
  // 1. Get All products
  // getAllProducts(function(data){console.log(JSON.parse(data))})

  // 2. Get specific variant
  // getVariant(VARIANTID, function(data){console.log(JSON.parse(data))})

  // 3. Get ISS Position
  // getISSPosition(function(data){console.log(data)});

  // 4. Update variant with ISS Position
  updatePriceWithISSPosition(VARIANTID, function(data) {
    console.log(data);
  });
  console.log("Lunch and learn running on port: " + port);
});
