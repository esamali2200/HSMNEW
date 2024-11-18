const mongoose = require("mongoose");
const Schema = mongoose.Schema;
 
// define the Schema (the structure of the article)
const customerSchema = new Schema(
    {
        FirstName: String,
    lastName: String,
    mobileNumber: String,
    address: String,
    age: Number,
    country: String,
    gender: String,
    bloodType: String,
    Department: String,
    doctor: String,
    TypeofOperation: String,
    notes: String,
    },{ timestamps: true });
 
 
// Create a model based on that schema
const customer = mongoose.model("customer", customerSchema);
 
 
// export the model
module.exports = customer