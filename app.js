const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('./models/connection')

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const factsRouter = require('./routes/facts');

const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/facts',factsRouter);

module.exports = app;
