const moment = require('moment');
const customer = require('../models/customerSchema');

exports.getHome = (req, res) => {
  customer.find()
    .then((result) => {
      res.render('index', { arr: result, moment });
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/');
    });
};



