const router = require('express').Router();
const isAuth = require('../middlewares/isAuth');
const { getHome } = require('../controllers/patients.controller');

router.get('/H', isAuth, getHome);

module.exports = router;



