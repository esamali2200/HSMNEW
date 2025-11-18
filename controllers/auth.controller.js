exports.getLogin = (req, res) => {
  if (req.session.isLoggedIn) {
    return res.redirect('/H');
  }
  res.render('user/login', { error: undefined });
};

exports.postLogin = (req, res) => {
  let { username, password } = req.body;
  username = typeof username === 'string' ? username.trim() : '';
  password = typeof password === 'string' ? password.trim() : '';

  if (!username && !password) {
    return res.status(400).render('user/login', { error: 'Please enter username and password' });
  }
  if (!username) {
    return res.status(400).render('user/login', { error: 'Please enter a username' });
  }
  if (!password) {
    return res.status(400).render('user/login', { error: 'Please enter a password' });
  }

  setTimeout(() => {
    if (username === (process.env.ADMIN_USERNAME || 'admin1234') && password === (process.env.ADMIN_PASSWORD || 'admin1234')) {
      req.session.isLoggedIn = true;
      req.session.user = {
        username,
        loginTime: new Date(),
        lastActive: new Date()
      };

      req.session.save(err => {
        if (err) {
          console.log(err);
          return res.render('user/login', { error: 'Login error occurred. Please try again.' });
        }
        res.redirect('/H');
      });
    } else {
      res.status(401).render('user/login', { error: 'Invalid username or password' });
    }
  }, 1000);
};

exports.postLogout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.clearCookie('connect.sid');
    res.set('Cache-Control', 'no-store');
    res.redirect('/');
  });
};



