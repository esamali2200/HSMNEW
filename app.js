const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const path = require("path");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const moment = require('moment'); 
const methodOverride = require('method-override');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

// تعريف مخزن الجلسات
const store = new MongoDBStore({
  uri: "mongodb+srv://esesalal2200:E2s0a0m2@cluster0.m2naw.mongodb.net/all-data?retryWrites=true&w=majority&appName=Cluster0",
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

// تعديل إعدادات الجلسة
app.use(session({
  secret: 'ZCM_SECRET_KEY_2024', // مفتاح سري جديد
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
mongoose.connect("mongodb+srv://esesalal2200:E2s0a0m2@cluster0.m2naw.mongodb.net/all-data?retryWrites=true&w=majority&appName=Cluster0")
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
app.get('/', (req, res) => {
  if (req.session.isLoggedIn) {
    return res.redirect('/H');
  }
  res.render("user/login", { error: undefined });
});

// تحسين مسار تسجيل الدخول
app.post('/', (req, res) => {
  const { username, password } = req.body;
  
  // تأخير بسيط لمنع محاولات تخمين كلمة المرور
  setTimeout(() => {
    if (username === 'admin1234' && password === 'admin1234') {
      req.session.isLoggedIn = true;
      req.session.user = { 
        username,
        loginTime: new Date(),
        lastActive: new Date()
      };
      
      req.session.save(err => {
        if (err) {
          console.log(err);
          return res.render('user/login', { error: 'حدث خطأ في تسجيل الدخول' });
        }
        res.redirect('/H');
      });
    } else {
      res.render('user/login', { error: 'بيانات الدخول غير صحيحة' });
    }
  }, 1000);
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.clearCookie('connect.sid');
    res.set('Cache-Control', 'no-store');
    res.redirect('/');
  });
});

// المسارات المحمية
app.get('/H', isAuth, (req, res) => {
  customer.find()
    .then((result) => {
      res.render("index", { arr: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/');
    });
});

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

