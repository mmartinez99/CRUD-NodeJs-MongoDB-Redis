const mongoose = require("mongoose");
const ObjectId = require("mongoose/lib/types/objectid");

const bibliothequeSchema = new mongoose.Schema({
    id:  ObjectId,
    telephone: String,
    commune: String,
    services_proposes: String,
    nomrue: String,
    descoll:String,
    codepostal: Number,
    nometablissement:String,
    heuresouverture:String
});

const bibliotheque = mongoose.model('bibliothequeList',bibliothequeSchema);

module.exports = bibliotheque;