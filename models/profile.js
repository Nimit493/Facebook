var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var Schema = mongoose.Schema;

var commentSchema = new Schema({
	author:String,
	data:String,
	postedAt:Date
});

var likeSchema = new Schema({
	likedBy:{
		type:String
	},
	numOfLikes:{
		type:Number,
		default:0
	}
});

var picSchema = new Schema({
	url:String,
	numOfLikes:{
		type:Number,
		default:0
	},
	likedBy: Array,
	comments:[commentSchema]
});

var statusSchema = new Schema({
	data:String,
	likes:[likeSchema],	
	comments:[commentSchema]
});

var profileSchema = new Schema({
	username:String,
	password:String,
	DOB :Date,
	sex: String,
	Address:String,
	pic:[picSchema],
	Status:[statusSchema]
});

profileSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Profile",profileSchema);
//module.exports = mongoose.model("pic",picSchema);