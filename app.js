const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const path = require("path");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const moment = require('moment'); 
const methodOverride = require('method-override');

// Middleware setup
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Live reload setup
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));

app.use(connectLivereload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);})

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

// Routes

// مسار GET لعرض صفحة تسجيل الدخول
app.get('/', (req, res) => {
  customer.find()
    .then((result) => {
      res.render("user/login", { arr: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
    });
});

// مسار POST لمعالجة تسجيل الدخول


app.post('/', (req, res) => {
  const { username, password } = req.body;
  // تحقق من بيانات الدخول هنا
  if (username === 'admin1234' && password === 'admin1234') {
     // تخزين اسم المستخدم في الجلسة
    res.redirect('/H');
  } else {
      res.render('user/login', { error: 'Invalid username or password' });
  }
});

app.get('/H', (req, res) => {
  customer.find()
    .then((result) => {
      res.render("index", { arr: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/user/add.html", (req, res) => {
  res.render("user/add");
});

app.get("/edit/:id", (req, res) => {
  customer.findById(req.params.id)
    .then((result) => {
      res.render("user/edit", { obj: result });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/user/:id", (req, res) => {
  customer.findById(req.params.id)
    .then((result) => {
      res.render("user/view", { obj: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/user/add/html", (req, res) => {
  customer.create(req.body)
    .then(() => {
      res.redirect("/H");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/search", (req, res) => {
  console.log(req.body);

  customer.find({
    $or: [
        { FirstName: req.body.searchText },
        { lastName: req.body.searchText }
    ]
}).then((result) =>{
    console.log(result);
    res.render("user/search" ,{arr: result})
  }).catch((err) => {
    console.log(err);
  });
});

app.post("/fill", (req, res) => {
  const departmentFilter = req.body.Department; // Get the selected department

  // Construct the query based on the selected department
  let query = {};
  if (departmentFilter) {
    query.Department = departmentFilter; // Filter by selected Department
  }

  // Find customers based on the department filter
  customer.find(query)
    .then((result) => {
      // Render the filtered results in the view
      res.render("user/fill", { arr: result });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error retrieving data");
    });
});



app.put("/edit/:id", (req, res) => {
  customer.updateOne({ _id: req.params.id }, req.body)
    .then(() => {
      res.redirect(`/user/${req.params.id}`);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.delete("/delete/:id", (req, res) => {
  console.log("*********************")
  customer.deleteOne({ _id: req.params.id }).then(() =>{
    res.redirect("/")
  }).catch((err) => {
    console.log(err);
  });
});