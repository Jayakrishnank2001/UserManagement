const express = require("express");
const session = require("express-session");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const nocache = require("nocache");
const router = require("./router");
const morgan=require("morgan")

const app = express();

const port = process.env.PORT || 3000;
const sessionSecret = uuidv4();

app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nocache());
app.set('view engine', 'ejs');
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true
}));
app.use('/route', router);

app.get('/', nocache(), (req, res) => {
  if (req.session.user) {
    return res.redirect('/route/dashboard');
  }
  var string = req.query.valid;
  res.render('base', { title: "Login System", err: string });
});
// Start the server
app.listen(port, () => {
  console.log("Listening to the server on http://localhost:3000");
});