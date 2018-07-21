//var queryString = "select product2 as asin from (select product2, count(product2) as recocount from test.orderrelation where product1 = '" + asin + "' group by product2 order by recocount desc limit 5) as tb1";
//final pro3-del2 code
'use strict';
var http = require('http')
var express = require('express')
var mysql = require('mysql')
var session = require('express-session')
var bodyParser = require('body-parser')
var validator = require('validator')
var stripchar = require('stripchar').StripChar

var app = express();

app.use(session({
  secret:'ediss',
  cookie:{maxAge:15*60*1000},
  resave: true,
	rolling:true,
	saveUninitialized:true
}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var pool = mysql.createPool({
	connectionLimit :50,
  host:"mysql-instance1.cejcrxrmql06.us-east-1.rds.amazonaws.com",
  user: "abhignabatchu",
  password: "admin123",
  charset: "utf8mb4",
  database: "edissdb2"
});

var con = mysql.createConnection({
  host:"mysql-instance1.cejcrxrmql06.us-east-1.rds.amazonaws.com",
  user: "abhignabatchu",
  password: "admin123",
  charset: "utf8mb4",
  database: "edissdb2"
});

con.connect(function(err){
  if(err){
    res.json({'message':'You have connection problem'});
  }
  else{
  console.log("connected!");
  }

});

app.post('/registerUser', function(req,res){

  var fname = req.body.fname;
  var lname = req.body.lname;
  var address = req.body.address;
  var city = req.body.city;
  var state = req.body.state;
  var zip = req.body.zip;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var role='customer';
	
	pool.getConnection(function(err, con) {
		if(err) throw err;
  
  var check = "select * from reguser where username = ?";
  con.query(check, [username], function(err,rows){
    //if(err) throw err;

    if(err || rows.length>=1){
       res.json({'message':'The input you provided is not valid'});
    }
else{
  if(city){
    var ucity = stripchar.RSExceptUnsAlpNum(city);
  }
    con.query('insert into reguser values (?,?,?,?,?,?,?,?,?,?)', [fname, lname, address, ucity, state, zip, email, username, password, role], function(err, rows){
      if(err){
        res.json({'message':'The input you provided is not valid'});
      }
      else{
         res.json({'message':fname+' was registered successfully'});
      }
});
  }
}); con.release();
		});
		
	
});

app.post('/login', function(req,res){
  var username = req.body.username;
var password = req.body.password;
pool.getConnection(function(err, con) {
		if(err) throw err;

con.query("select * from reguser where username=? and password=?",[username,password],function(err, rows){

  if (err || rows.length===0){
     res.json({'message':'There seems to be an issue with the username/password combination that you entered'});
  }
  else if(rows.length>0){

      req.session.role = rows[0].role;
    req.session.username = username;

    console.log("Successful login "+req.body.username);
    console.log(req.session.role);

       res.json({'message':'Welcome '+rows[0].fname});
  }
  else{
       res.json({'message':'There seems to be an issue with the username/password combination that you entered'});
  }
});
con.release();
	});
	
});


app.post('/logout', function(req,res){
	pool.getConnection(function(err, con) {
		if(err) throw err;
  if(req.session.username)
  	{
  		req.session.destroy();
  	    res.json({'message':'You have been successfully logged out'});
  	}

  	else
  	{
  		res.json({'message':'You are not currently logged in'});
  	}
	con.release();
	});
	
});

app.post('/updateInfo', function(req,res){

  var fname1 = req.body.fname;
  var lname1 = req.body.lname;
  var address1 = req.body.address;
  var city1 = req.body.city;
  var state1 = req.body.state;
  var zip1 = req.body.zip;
  var email1 = req.body.email;
  var username1 = req.body.username;
  var password1 = req.body.password;
  var qupdate = "UPDATE reguser SET ";
  
  pool.getConnection(function(err, con) {
		if(err) throw err;

  if(req.session.username){
          if(fname1=='' && lname1=='' && address1=='' && city1=='' && state1=='' && zip1=='' && email1=='' && username1=='' && password1==''){
              res.json({'message':'The input you provided is not valid'});
            }
            else{
              if(fname1){
                qupdate += "fname = '"+fname1+"',";
              }
                if(lname1){
                qupdate += "lname = '"+lname1+"',";
              }
              if(address1){
                qupdate += "address = '"+address1+"',";
              }
              if(city1){
                qupdate += "city = '"+city1+"',";
              }
              if(state1){
                qupdate += "state = '"+state1+"',";
              }
              if(zip1){
                qupdate += "zip = '"+zip1+"',";
              }
              if(email1){
                qupdate += "email = '"+email1+"',";
              }

              if(username1){
                var check = "select * from reguser where username = ?";
                con.query(check, [username1], function(err,rows){
                  if(err) throw err;

                  if(rows.length>=1){
                     res.json({'message':'The input you provided is not valid'});
                  }
              else{
                qupdate += " fname = '"+ fname1+"',";
              }
            });
              }

              if(password1){
                qupdate += "password = '"+password1+"',";
              }


              qupdate = qupdate.substring(0,qupdate.length-1);
              qupdate = qupdate + " WHERE username='" +req.session.username+"';";
              console.log(qupdate);
              con.query(qupdate, function(err,rows){
                if(err) throw err;
                console.log(rows.affectedRows + " record(s) updated");
              });

               res.json({'message':fname1+' your information was successfully updated'});

              }
            }

      else{
        	res.json({'message':'You are not currently logged in'});
      }
con.release();	
  });
	
	  
    });


    app.post('/addProducts', function(req,res){

	pool.getConnection(function(err, con) {
		if(err) throw err;
		
      if(req.session.username){
        if(req.session.role=="admin"){
          console.log(req.session.username);
          console.log(req.session.role);
          var id = req.body.asin;
          var pname = req.body.productName;
          var pdescription = req.body.productDescription;
          var pgroup = req.body.group;
		  
		  
		
          con.query("select * from products where asin=?",id, function(err,rows){
            if(err || rows.length>0){
              res.json({'message':'The input you provided is not valid'});
            }
            else{
              con.query("insert into products values (?,?,?,?)", [id,pname,pdescription,pgroup], function(err,rows){
                if(err) throw err;
                else{
                  res.json({"message":pname+" was successfully added to the system"});
                }
              });

            }
          });
        }
        else{
          res.json({'message':'You must be an admin to perform this action'});
        }
      }
      else{
        res.json({'message':'You are not currently logged in'});
      }
	con.release();
	});
	      
    });
	
	
    app.post('/modifyProduct', function(req,res){
		
		pool.getConnection(function(err, con) {
		if(err) throw err;
		
    if(req.session.username){
      if(req.session.role=="admin"){
        var id = req.body.asin;
        var pname = req.body.productName;
        var pdescription = req.body.productDescription;
        var pgroup = req.body.group;
        console.log(pname);
		
		
		

        con.query("select * from products where asin=?",id, function(err,rows){
          //if(err) throw err;
          if(err || rows.length==0){
            console.log('bjk');
             res.json({'message':'The input you provided is not valid'});
          }
          else if(id =='' || pname =='' || pdescription =='' || pgroup ==''){
            console.log('bshf');
            res.json({'message':'The input you provided is not valid'});
          }
          else{
            console.log('vhdb');
            var qupdate = "update products set ";

            if(pname){
              qupdate = qupdate + "productName='"+pname+"', ";
            }

            if(pdescription){
              qupdate = qupdate + "productDescription='"+pdescription+"', ";
            }

            if(pgroup){
              qupdate = qupdate + "groups='"+pgroup+"'";
            }

            qupdate = qupdate.substring(0, qupdate.length);
            qupdate = qupdate+ " where asin = '"+id+"';";
            console.log(qupdate);
            qupdate = mysql.format(qupdate);
            con.query(qupdate, function(err,rows){
              if(err) throw err;
              else{
                console.log(rows.affectedRows + " record(s) updated");
                //var name = JSON.stringify(pname);
                res.json({'message':pname+' was successfully updated'});
              //  res.json({'message':pname+' was successfully updated'});
                console.log(pname);
              }
            });


          }
        });
      }
      else{
        res.json({'message':'You must be an admin to perform this action'});
      }
    }
    else{
      res.json({'message':'You are not currently logged in'});
    }
	con.release();
	});
	    
    });

    app.post('/viewUsers', function(req,res){
		
		pool.getConnection(function(err, con) {
		if(err) throw err;
		
      if(req.session.username){
        if(req.session.role=="admin"){
          var fname = req.body.fname;
          var lname = req.body.lname;
		  
		  

          if(fname && !lname){
            con.query("select fname, lname, username from reguser where fname like '%" + fname + "%'", function(err,rows){
              if(err || rows.length==0){
                res.json({"message":"There are no users that match that criteria"});
              }
              else{
                res.json({"message":"The action was successful",rows});
              }
            });
          }
          else if(lname && !fname){
            con.query("select fname, lname, username from reguser where lname like '%" + lname + "%'", function(err,rows){
              if(err || rows.length==0){
                res.json({"message":"There are no users that match that criteria"});
              }
              else{
                res.json({"message":"The action was successful",rows});
              }
            });
          }
          else if(fname && lname){
            con.query("select fname, lname, username from reguser where fname like '%" +fname+ "%' and lname like '%"+lname+ "%'", function(err,rows){
              if(err || rows.length==0){
                res.json({"message":"There are no users that match that criteria"});
              }
              else{
                res.json({"message":"The action was successful",rows});
              }
            });
          }
          else{
            con.query("select fname, lname, username from reguser", function(err,rows){
              if(err || rows.length==0){
                res.json({"message":"There are no users that match that criteria"});
              }
              else{
                res.json({"message":"The action was successful",rows});
              }
            });
          }
          }


        else{
          res.json({'message':'You must be an admin to perform this action'});
        }
      }

      else{
        res.json({'message':'You are not currently logged in'});
      }
	  con.release();
	});
	    

    });

    app.post('/viewProducts', function(req,res){
      var id = req.body.asin;
      var pgroup = req.body.groups;
      var keyword = req.body.keyword;
	  
	  pool.getConnection(function(err, con) {
		if(err) throw err;

      if(id){
        con.query("select asin, productName from products where asin=?",id, function(err,rows){
          if(err || rows.length==0){
            res.json({ 'message': "There are no products that match that criteria"});
          }
          else{
            res.json({"product":rows});
          }
        });
      }
      else if(keyword){
        con.query("select asin, productName from products where productName like '%"+keyword+"%' or productDescription like '%"+keyword+"%'", function(err,rows){
          if(err || rows.length==0){
            res.json({ 'message': "There are no products that match that criteria"});
          }
          else{
            res.json({"product":rows});
          }
        });
      }
        else if(pgroup){
          con.query("select asin, productName from products where groups=?",pgroup,function(err,rows){
            if(err || rows.length==0){
              res.json({ 'message': 'There are no products that match that criteria'});
            }
            else{
              res.json({"product":rows});
            }
          });
        }
        else{
          con.query("select asin, productName from products", function(err,rows){
            if(err || rows.length==0){
              res.json({ 'message': 'There are no products that match that criteria'});
            }
            else{
              res.json({"product":rows});
            }
          });
        }
		  con.release();
	});
	    
		
});

  app.post('/buyProducts', function(req,res){
	  
	  pool.getConnection(function(err, con) {
		if(err) throw err;
		
    if(req.session.username){
      if(req.session.role=='customer'){
		  var icustomer = req.session.username;
		var list = req.body.products;  
       var val = "";
	   var listCount = list.length;
	   var temp=0;
	   var prod=[];
	   var result =[];
	   
	   for(var i=0;i<list.length;i++){
		   if(temp){
			  val+=',';
			
		}
		result [i]= list[i].asin;
		prod[i]=list[i].asin;
		console.log('prd'+prod[i]);
			val+=("'"+list[i].asin+"'");
			
		console.log(val);
		console.log(result[i]);
			temp++;
		 
	   }
	   
		
	   con.query("select asin from products where asin in ("+val+")", function(err,rows){
		   if(err || rows.length!=listCount){
			    res.json({ 'message': 'There are no products that match that criteria'});
		   }
		   else
		   {
			   for(var i=0;i<result.length;i++){
			 con.query("insert into buyprod values (?,?)",[icustomer,result[i]], function(err,rows2){
				 if(err){
					console.log('error');
				 }
				
			 });  
			   }
		   
		//insert for recommendations
			//for(var i=0;i<listCount-1;i++){
				for(var j=0;j<listCount;j++){
					for(var k=listCount-1;k>=0;k--){
						if(prod[j]!=prod[k]){
							con.query("insert into recom values (?,?) ",[prod[j],prod[k]], function(err,rows){
								if(err || rows.length==0){
								console.log({ 'message': 'There are no products that match that criteria'});	
								}
								else{
								console.log({'message':'The action was successful'});
								}
							});
						}
					}
				//}
			}
			res.json({'message':'The action was successful'});	   
		   }
	   });
	   

      
	  }
      else{
          res.json({'message':'You must be a customer to perform this action'});
      }
    }
    else{
      res.json({'message':'You are not currently logged in'});
    }
	con.release();
	});
	  
  });

  app.post('/productsPurchased', function(req,res){

  pool.getConnection(function(err, con) {
		if(err) throw err;

	  
    if(req.session.username){
      if(req.session.role=='admin'){
        var iusername = req.body.username;
		
		
		con.query("select * from buyprod where customer=?",iusername, function(err,rows){
		  if(err || rows.length==0){
			  console.log('sda');
            res.json({ 'message': "There are no products that match that criteria"});
          }
          else{
			  console.log('asc');
			  //con.query('select products.productName,count(*) as quantity from products join buyprod on products.asin = buyprod.asin where buyprod.customer=?',[iusername],function(err, rows){
		con.query('select products.productName,count(productName) as quantity from products join buyprod on products.asin = buyprod.asin where buyprod.customer=?',[iusername],function(err, rows){
				
		  //con.query('select b.productName as pname, a.asin, count(a.asin) as qty from purchaseHistory a, products_r b where a.user =? and a.asin=b.asin group by a.asin',[iusername],function(err, rows){
			 if(err || rows.length==0){
				 console.log('ffdg');
				res.json({ 'message': "There are no products that match that criteria"}); 
			 } 
			 else{
				 console.log('safa');
            res.json({'message':'The action was successful','products':rows});
			 }
			
		  });
		  }
        });

      }
      else{
        res.json({'message':'You must be an admin to perform this action'});
      }
    }
    else{
      res.json({'message':'You are not currently logged in'});
    }
	con.release();
	});
	  
  });

  app.post('/getRecommendations',function(req,res){
    pool.getConnection(function(err, con) {
		if(err) throw err;
		
	if(req.session.username){
     var iasin = req.body.asin;
	 
		
		var check = con.query("select asinb as asin from recom where asina="+iasin+" group by asinb order by count(*) desc limit 5",function(err,rows){
			if(err || rows.length==0){
				res.json({'message': "There are no recommendations for that product"});
				//console.log(check);
			}
			else if(rows.length>=1){
				res.json({'message':'The action was successful','products':rows});
				console.log('sucess recom');
			}
			else{
				res.json({ 'message': "There are no recommendations for that product"});
			}
		});


    }
    else{
      res.json({'message':'You are not currently logged in'});
    }
	con.release();
	});
	  
  });

app.listen(9000, function(){
  console.log('Listening to port 9000');
});
