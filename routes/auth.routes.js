const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { getLogin, postLogin, postLogout } = require('../controllers/auth.controller');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.'
});

router.get('/', getLogin);
router.post('/', loginLimiter, postLogin);
router.post('/logout', postLogout);

module.exports = router;


