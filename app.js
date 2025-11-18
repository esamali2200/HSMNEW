require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const path = require("path");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const moment = require('moment'); 
const methodOverride = require('method-override');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const authRoutes = require('./routes/auth.routes');
const patientsRoutes = require('./routes/patients.routes');

// تعريف مخزن الجلسات
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});

// معالجة أخطاء مخزن الجلسات
store.on('error', function(error) {
  console.log('Session Store Error:', error);
});

// Middleware لمنع التخزين المؤقت
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Middleware الأساسي
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

// Content Security Policy مخصصة في التطوير للسماح بالسكريبتات الداخلية و live-reload
if (process.env.NODE_ENV !== 'production') {
  app.use(helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'http://localhost:35729'],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc: ["'self'", 'ws://localhost:35729', 'http://localhost:35729'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"]
    }
  }));
}

// تعديل إعدادات الجلسة
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_me_in_env',
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 1000 * 60 * 15, // 15 دقيقة
    httpOnly: true, // حماية من XSS
    secure: process.env.NODE_ENV === 'production', // HTTPS في الإنتاج
    sameSite: 'strict' // حماية من CSRF
  }
}));

// CSRF protection
const csrfProtection = csrf();
app.use(csrfProtection);

// Inject csrf token to all templates
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
// Rate limit لمسار تسجيل الدخول للحد من محاولات التخمين
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.'
});


// إضافة middleware لحماية إضافية
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// middleware للتحقق من نشاط المستخدم
const checkUserActivity = (req, res, next) => {
  if (req.session.user) {
    const now = new Date();
    const lastActive = new Date(req.session.user.lastActive);
    const inactiveTime = now - lastActive;
    
    // إذا كان المستخدم غير نشط لمدة 15 دقيقة
    if (inactiveTime > 15 * 60 * 1000) {
      req.session.destroy(err => {
        if (err) console.log(err);
        return res.redirect('/?message=session_expired');
      });
    } else {
      req.session.user.lastActive = now;
    }
  }
  next();
};

// استخدام middleware
app.use(checkUserActivity);

// Middleware للتحقق من تسجيل الدخول
const isAuth = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect('/');
  }
  next();
};

// Live reload setup
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));
app.use(connectLivereload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

// اتصال قاعدة البيانات
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

// Import customer model
const customer = require("./models/customerSchema");

// مسار التحقق من حالة تسجيل الدخول
app.get('/check-auth', (req, res) => {
  if (req.session.isLoggedIn) {
    res.status(200).send('Authenticated');
  } else {
    res.status(401).send('Not authenticated');
  }
});

// Routes
app.use('/', authRoutes);

// المسارات
app.use('/', authRoutes);
app.use('/', patientsRoutes);

app.get("/user/add.html", isAuth, (req, res) => {
  res.render("user/add");
});

app.get("/edit/:id", isAuth, (req, res) => {
  customer.findById(req.params.id)
    .then((result) => {
      res.render("user/edit", { obj: result });
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/');
    });
});

app.get("/user/:id", isAuth, (req, res) => {
  customer.findById(req.params.id)
    .then((result) => {
      res.render("user/view", { obj: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/');
    });
});

app.post("/user/add/html", isAuth, (req, res) => {
  customer.create(req.body)
    .then(() => {
      res.redirect("/H");
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/');
    });
});

app.post("/search", isAuth, (req, res) => {
  customer.find({
    $or: [
      { FirstName: req.body.searchText },
      { lastName: req.body.searchText }
    ]
  }).then((result) => {
    res.render("user/search", { arr: result });
  }).catch((err) => {
    console.log(err);
    res.redirect('/');
  });
});

app.post("/fill", isAuth, (req, res) => {
  const departmentFilter = req.body.Department;
  let query = {};
  if (departmentFilter) {
    query.Department = departmentFilter;
  }
  customer.find(query)
    .then((result) => {
      res.render("user/fill", { arr: result });
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/');
    });
});

app.put("/edit/:id", isAuth, (req, res) => {
  customer.updateOne({ _id: req.params.id }, req.body)
    .then(() => {
      res.redirect(`/user/${req.params.id}`);
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/');
    });
});

app.delete("/delete/:id", isAuth, (req, res) => {
  customer.deleteOne({ _id: req.params.id })
    .then(() => {
      res.redirect("/H");
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/');
    });
});

