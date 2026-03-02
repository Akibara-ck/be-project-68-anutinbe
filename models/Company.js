const mongoose= require('mongoose');

const CompanySchema = new mongoose.Schema({//fixed name
    name:{
        type: String,
        required: [true,'Please add a name'],
        unique:true,
        trim:true,
        maxlength:[50,'Name cannot be more than 50 characters']
    },
    address:{
        type:String,
        required: [true,'Please add an address']
    },
    website:{
        type: String, 
        required: [true, 'Please add a Website'],
        match: [
            /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
            "Please add a valid URL"
        ]
    },
    description:{
        type: String, 
        required: [true,'Please add a description']
    },
    telephone:{
        type:String,
        required: [true,'Please add a telephone number']
    }
},{
    toJSON: {virtuals:true},
    toObject: {virtuals:true}
});

CompanySchema.virtual('interviews',{
    ref: 'Interview',
    localField: '_id',
    foreignField:'company',
    justOne:false
});


module.exports = mongoose.model('Company',CompanySchema);