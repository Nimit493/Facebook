var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var cloudinary = require('cloudinary');
var jwt = require('jsonwebtoken');
var config = require('../config.js');

var profile = require('../models/profile');
//var picSchema = require('../models/pic');
var Verify = require('./verify');
var passport = require('passport');

var bodyParser = require('body-parser');
router.use(bodyParser.json());

var imgpath = 'N:\DSC_1726.JPG'

//Register a new user
router.post('/register',function(req,res){
	profile.register(new profile({username:req.body.username}),req.body.password,function(err,profile){
		if(err){
			if (err.status=500){
				console.log('err: '+err);
				return res.status(500).json({status:"Username already taken"});
			}
		}
		if (req.body.DOB){
			profile.DOB = req.body.DOB;
		}
		if (req.body.sex){
			profile.sex = req.body.sex;
		}
		if (req.body.address){
			profile.Address = req.body.address;
		}
		if (req.body.url){
			profile.pic.url = req.body.url;
		}
		
		profile.save(function(err,user){
		passport.authenticate('local')(req,res,function(){
			return res.status(200).json({status:'Registration Successful'});
		});
		});
	});
});

//Login
router.post('/login',function(req,res,next){
	//console.log("1.")
	//console.log(req.body+" :req");
	//console.log(req.body.username+" :username");
	//console.log(req.body.password+" :password");
	passport.authenticate('local',function(err,user,info){
		//console.log("user: "+user);
		//console.log("info: "+info.body);
		if (err){
		//	console.log("2. ")
			return next(err);
		}
		if(!user){
			//console.log("3. ")
			return res.status(401).json({err:info});
		}
		req.logIn(user,function(err){
		//	console.log("4. ")
			if (err){
			//	console.log("5. ")
				
				return res.status(500).json({
					err:'could not login user'
				});
			}			
			var token = Verify.getToken(user);
			//console.log(token);
			//console.log("req: "+req.body);
			//console.log("res: "+res.body);
			res.status(200).json({
				status:'Login successful',
				success:true,
				token:token
			});
			//console.log("res: "+res.status.token);
			//console.log("token: "+res.body.token);
		});
	})(req,res,next);
	//console.log("res: "+res);
		//	console.log("token: "+res.token);
});

//Logout	
router.get('/logout',function(req,res){
	req.logout();
	res.status(200).json({
		status:'Bye'
	});
});

//View All users

router.get('/view',function(req,res,next){
	profile.find({},function(err,doc){
		if (err) throw err;
		res.json(doc);
	});
});

//Upload Dp for a registered and logged-in user ***Remember to use \ tp escape character in json string
router.post('/dp',function(req,res,next){
	var user = "";
	var dplink = "";
	imgpath = req.body.url;
	cloudinary.uploader.upload(imgpath,function(doc){
		//console.log(doc);
		console.log('url: '+doc.url);
		dplink = doc.url;
		//res.json(doc);
	
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	if (token){
		console.log(typeof token);
		jwt.verify(token,config.secretKey,function(err,decoded){
			if(err){
				var err = new Error("You are not authenticated");
				err.status = 401;
				return next(err);
				}else{
					req.decoded = decoded;
					console.log('decoded: '+decoded);
					user = decoded._doc.username
					console.log('user: '+user);
					
					profile.update({"username":user},{$push:{"pic":{"url":dplink}}},function(err,data){
						if (err) {throw err;}else{
						console.log("inside final else");
						//Connection:Close;
						}
						//res.json(data);}
					});
					res.status(200).json({status:"Addedd successfully"});
				}
				
		});
	}
	});
	
});

//Add a new status
router.post('/status',function(req,res,next){
	var stupdate = req.body.write;
	
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	if (token){
		jwt.verify(token,config.secretKey,function(err,decoded){
			if (err){
				var err = new Error("You are not authenticated");
				err.status =  401;
				return next(err);
			}else{
				req.decoded = decoded;
				var user = decoded._doc.username;
				console.log("user: "+user);
				console.log("stupdate: "+stupdate);
				
				profile.update({"username":user},{$push:{"Status":{"data":stupdate}}},function(err,data){
					if (err){
						throw err;
					}else{
						console.log(data);
						res.status(200).json({status:"Added successfully"});
					}
				
				});
			}
		});
	}
});

router.post('/dpcomment',function(req,res,next){
	var comment = req.body.comment;
	var recepient = req.body.recepient;
	var id = req.body.id;
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
		if (token){
		jwt.verify(token,config.secretKey,function(err,decoded){
			if (err){
				var err = new Error("You are not authenticated");
				err.status =  401;
				return next(err);
			}else{
				req.decoded = decoded;
				var user = decoded._doc.username;
				var userid = decoded._doc._id;
				console.log("user: "+user);
				console.log("userid: "+userid);
				console.log("recepient: "+recepient);
				console.log("comment: "+comment);
				console.log("Id: "+id);
				
					profile.find({"pic._id":id},{"pic":1},function(err,doc){
						console.log('found the pic '+ doc);
						var image = doc[0].pic.id(id);
						console.log(image,' :image');
						
						image.comments.push({'author':user,'data':comment,'postedAt':new Date()});
						console.log('image: '+image);
						doc[0].save(function(err,doc){
							if (err){
								console.log(err.message);
							}
							console.log("chakko: "+doc);
							//res.json(doc);
						});
						res.json(image);
					});
			}
		});
	}
	
	});

router.post('/statuscomment',function(req,res,next){
	var comment = req.body.comment;
	var recepient = req.body.recepient;
	var id = req.body.id;
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
		if (token){
		jwt.verify(token,config.secretKey,function(err,decoded){
			if (err){
				var err = new Error("You are not authenticated");
				err.status =  401;
				return next(err);
			}else{
				req.decoded = decoded;
				var user = decoded._doc.username;
				var userid = decoded._doc._id;
				console.log("user: "+user);
				console.log("userid: "+userid);
				console.log("recepient: "+recepient);
				console.log("comment: "+comment);
				console.log("Id: "+id);
				
					profile.find({"Status._id":id},{"Status":1},function(err,doc){
						console.log('found the status '+ doc);
						var statusdoc = doc[0].Status.id(id);
						console.log(statusdoc,' :status');
						
						statusdoc.comments.push({'author':user,'data':comment,'postedAt':new Date()});
						console.log('status: '+statusdoc);
						doc[0].save(function(err,doc){
							if (err){
								console.log(err.message);
							}
							console.log("chakko: "+doc);
							//res.json(doc);
						});
						res.json(statusdoc);
					});
			}
		});
	}
	
	});
	
	
router.post('/dplike',function(req,res,next){
	var recepient = req.body.recepient;
	var id = req.body.id;
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
		if (token){
		jwt.verify(token,config.secretKey,function(err,decoded){
			if (err){
				var err = new Error("You are not authenticated");
				err.status =  401;
				return next(err);
			}else{
				req.decoded = decoded;
				var user = decoded._doc.username;
				var userid = decoded._doc._id;
				console.log("user: "+user);
				console.log("userid: "+userid);
				console.log("recepient: "+recepient);
				console.log("Id: "+id);
				
					profile.find({"pic._id":id},{"pic":1},function(err,doc){
						//console.log('found the status '+ doc);
						var image = doc[0].pic.id(id);
						//console.log(image,' :status');
						//image.$inc:{'numOfLikes':1};
						console.log("array: "+image.likedBy);
						if (image.likedBy.indexOf(user)<0){
							image.likedBy.push(user);
							
						console.log('length: '+image.likedBy.length);
						//image.numOfLikes.update(image.likedBy.length);
						//console.log('status: '+image);
						doc[0].save(function(err,doc){
							if (err){
								console.log(err.message);
							}
							//console.log("chakko: "+doc);
							//res.json(doc);
						});
						res.status(200).json({'Number of likes':image.likedBy.length,'Liked By':image.likedBy});
						}else{
							console.log('ending');
							res.end();
						}	
							
						
						//res.json(image);
					});
			}
		});
	}
	
})
	
	
module.exports = router;