const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var hbs = require('express-handlebars');
var mysql = require('mysql');


var router = express.Router();



var apps = require('express')();
var server = require('http').Server(app);

var session=require('express-session');
app.use(session({secret: 'ssshhhhh'}));
//app.use(session({secret:'app',cookie:{maxAge:6000}}));
  var sess;
  
app.use(bodyParser.urlencoded({ extended: true }));

var indexRouter = require('./routes/index');

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const scopes = 'read_products';
const forwardingAddress = "https://269b6fbc.ngrok.io"; // Replace this with your HTTPS Forwarding address

// view engine setup
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname +'/views/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');




app.listen(8082, () => {
  console.log('Example app listening on port 8082!');
  
});

app.get('/', (req, res) => {
	
  res.render('index', { shopname : req.query.shopname  });
  
});


app.get('/shopify', (req, res) => {
  const shop = req.query.shop;
   
   if (shop) {
    const state = nonce();
    const redirectUri = forwardingAddress + '/shopify/callback';
    const installUrl = 'https://' + shop +
      '/admin/oauth/authorize?client_id=' + apiKey +
      '&scope=' + scopes +
      '&state=' + state +
      '&redirect_uri=' + redirectUri;

    res.cookie('state', state);
	
    res.redirect(installUrl);
  } else {
    return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
  }
});

app.get('/shopify/callback', (req, res) => {
  const { shop, hmac, code, state } = req.query;
/*  const stateCookie = cookie.parse(req.headers.cookie).state;

  if (state !== stateCookie) {
    return res.status(403).send('Request origin cannot be verified');
  }*/

  if (shop && hmac && code) {
    const map = Object.assign({}, req.query);
delete map['signature'];
delete map['hmac'];
const message = querystring.stringify(map);
const providedHmac = Buffer.from(hmac, 'utf-8');
const generatedHash = Buffer.from(
  crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex'),
    'utf-8'
  );
let hashEquals = false;
// timingSafeEqual will prevent any timing attacks. Arguments must be buffers
try {
  hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
// timingSafeEqual will return an error if the input buffers are not the same length.
} catch (e) {
  hashEquals = false;
};

if (!hashEquals) {
  return res.status(400).send('HMAC validation failed');
}

const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
const accessTokenPayload = {
  client_id: apiKey,
  client_secret: apiSecret,
  code,
};

request.post(accessTokenRequestUrl, { json: accessTokenPayload })
.then((accessTokenResponse) => {
  const accessToken = accessTokenResponse.access_token;

  const shopRequestUrl = 'https://' + shop + '/admin/api/2020-01/shop.json';
const shopRequestHeaders = {
  'X-Shopify-Access-Token': accessToken,
};

request.get(shopRequestUrl, { headers: shopRequestHeaders })
.then((shopResponse) => {
	const obj = JSON.parse(shopResponse);
	console.log(obj.shop.name);
	var shopname = obj.shop.name;
	var shopurl = obj.shop.domain;
	var datetime = new Date();
	/*var sql = 'SELECT * FROM pidge_client WHERE client_name ='+ mysql.escape(shopname) ;
	db.query(sql, function (err, result) {
			if (result) {
				result.forEach((value) => {
				if(value.status == 'inactive'){
				res.redirect('/sucess');
				res.end();
				}else{
					res.redirect('/test');
					res.end();
				}
				});
			}else{*/
 /* var sql1 = "INSERT INTO pidge_client (client_name, shop_name,status,created_at,modified_at) VALUES ?";
  var values = [
    [shopname, shopurl , 'inactive',datetime,datetime]
	];
  db.query(sql1,[values], function (err, result) {
    if (err) throw err;
   
	//res.render('sucess', {  });
	res.redirect('/sucess');
	res.end();
  });*/
		/*	}
			
	});*/
	
	res.redirect('/sucess/?shopname='+ shopname +'&shopurl='+shopurl);
	res.end();
	//res.redirect('/?shopname='+ shopname);
	
	//res.end();
})
.catch((error) => {
  res.status(error.statusCode).send(error.error.error_description);
});
  // TODO
  // Use access token to make API call to 'shop' endpoint
})
.catch((error) => {
  res.status(error.statusCode).send(error.error.error_description);
});

    // TODO
    // Validate request is from Shopify
    // Exchange temporary code for a permanent access token
      // Use access token to make API call to 'shop' endpoint
  } else {
    res.status(400).send('Required parameters missing');
  }
});
app.get('/', (req, res) => {
	var shopname = req.query.shopname;
	console.log(shopname);
	var sql = 'SELECT * FROM pidge_client WHERE client_name ='+ mysql.escape(shopname) ;
		db.query(sql, function (err, result) {
			if (result) {
				result.forEach((value) => {
				if(value.status == 'inactive'){
				res.render('sucess', {  });
				}else{
				res.render('test', {  });	
				}
				});
			}else{
				res.render('index', { shopname : req.query.shopname  });
			}
			
		});
	
	
		
	
});

app.post('/shopify', function(req, res, next) {
	var shopurl = req.body.url;
	console.log(shopurl);
	
	if (shopurl) {
    const state = nonce();
    const redirectUri = forwardingAddress + '/shopify/callback';
    const installUrl = 'https://' + shopurl +
      '/admin/oauth/authorize?client_id=' + apiKey +
      '&scope=' + scopes +
      '&state=' + state +
      '&redirect_uri=' + redirectUri;

    res.cookie('state', state);
	console.log(req.query.shopname);
    res.redirect(installUrl);
  } else {
    return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
  }
	
	/*var shopurl = req.body.url;
	var shopname = req.body.shopname;
	 var datetime = new Date();
	 
	
  var sql = "INSERT INTO pidge_client (client_name, shop_name,status,created_at,modified_at) VALUES ?";
  var values = [
    [shopname, shopurl , 'inactive',datetime,datetime]
	];
  db.query(sql,[values], function (err, result) {
    if (err) throw err;
   
	res.render('sucess', {  });
	
	
  });*/
		
	
});
app.get('/sucess', (req, res) => {
	var shopname = req.query.shopname;
	var shopurl = req.query.shopurl;
	var datetime = new Date();
console.log(shopurl);
 /* var sql = "INSERT INTO pidge_client (client_name, shop_name,status,created_at,modified_at) VALUES ?";
  var values = [
    [shopname, shopurl , 'inactive',datetime,datetime]
	];
  db.query(sql,[values], function (err, result) {
    if (err) throw err;
   
	res.render('sucess', {  });
	
	
  });*/

	var sql = 'SELECT * FROM pidge_client WHERE client_name ='+ mysql.escape(shopname) ;
	db.query(sql, function (err, result) {
		
			if (result) {
				result.forEach((value) => {
					console.log(value.status);
					
				if(value.status == 'inactive'){
				res.render('sucess', {  });
				
				}else{
					
				res.render('test', {  });
				}
				});
			}
			if (result == ''){
				 var sql = "INSERT INTO pidge_client (client_name, shop_name,status,created_at,modified_at) VALUES ?";
  var values = [
    [shopname, shopurl , 'inactive',datetime,datetime]
	];
  db.query(sql,[values], function (err, result) {
    if (err) throw err;
   
	res.render('sucess', {  });
	
	
  });
			}
	});
//	res.render('sucess', {  });
	
});
app.get('/admin', (req, res) => {
	
	res.render('admin/login', {  });
});
app.post('/admin/dashboard', function(req, res, next) {
	sess=req.session;
	sess.username = req.body.username;
	console.log(sess.username);
	 db.query("SELECT * FROM admin", function (err, result, fields) {
    if (err) throw err;
   // console.log(result);
	 
			result.forEach((value) => {
				console.log (value);
		
	if((req.body.username == value.name) && (req.body.password == value.password)){

	  req.session.loggedIn=true;
      res.redirect('/admin/dashboard/?name='+ req.body.username);
	
		
	}else{
	 res.render('admin/login', {  });
		
	}
	});
	
	});

});

app.get('/admin/dashboard', function(req, res, next) {

	 db.query("SELECT * FROM pidge_client", function (err, result, fields) {
    if (err) throw err;
		
				res.render('admin/dashboard', { value : result });
		
	
	
	});
  
});
 app.get('/logout', (req, res) => {
	req.session.loggedIn=false;
	res.render('admin/login', {  });
});
 
 app.post('/approve', function(req, res, next) {
	 var shopname = req.body.client_name;
	  var shop_name = req.body.shop_name;
	 var status = req.body.status;
	
	  var sql = "UPDATE pidge_client SET status = '"+status+"' WHERE client_name = "+ mysql.escape(shopname);
  db.query(sql, function (err, result) {
    if (err) throw err;
   // console.log(result.affectedRows + " record(s) updated");
	res.redirect('/admin/dashboard/');
  });
	 
//	res.redirect('/admin/dashboard/');
	 
 });