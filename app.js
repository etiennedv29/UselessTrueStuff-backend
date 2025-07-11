const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('./models/connection')

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const factsRouter = require('./routes/facts');
const commentsRouter = require('./routes/comments')

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
app.use('/comments', commentsRouter)

//const { dailyFactGenerator } = require("./controllers/facts")
// const startServer = async () => {
//     try {
//       // Exécution de la fonction de génération de fait au démarrage du serveur
//       console.log("Starting daily fact generation...");
//       const fact = await dailyFactGenerator(); // Appel à la fonction qui génère un fait
//       console.log("Generated Fact:", fact);
//     } catch (error) {
//       console.error("Error during daily fact generation:", error);
//     }
  
//   };
  
//   // Lancer la fonction au démarrage
//   startServer();

module.exports = app;
