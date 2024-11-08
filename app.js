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

  mongoose.connect("mongodb+srv://app1:DV14zVqWQvCZctiF@cluster0.m2naw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
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
app.get('/', (req, res) => {
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
      res.redirect("/");
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

