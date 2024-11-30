const mongoose = require("mongoose");
const Schema = mongoose.Schema;
 
// define the Schema (the structure of the article)
const customerSchema = new Schema(
    {
        FirstName: "String",
        lastName: "String",
        mobileNumber: "String",
        address: "String",
        age: { "type": "Number", "min": 0 },
        gender: "String",
        country: "String",
        surgeon: "String",
        bloodType: "String",
        Department: "String",
        surgeonAssistent1: "String",
        surgeonAssistent2: "String",
        surgeonAssistent3: "String",
        AnasthesiaTechnia: "String",
        Scrub2: "String",
        Scrub1: "String",
        TypeOfAnasthesia: "String",
        Anasthesiologist1: "String",
        Anasthesiologist2: "String",
        TypeofOperation: "String",
        notes: "String",
        diagnosis: "String",
        fileNU: "String",
        AdmissionDate: "Date"
      },{ timestamps: true });
 
 
// Create a model based on that schema
const customer = mongoose.model("customer", customerSchema);
 
 
// export the model
module.exports = customer