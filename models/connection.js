const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://admin:admin@cluster0.awuhqwt.mongodb.net/uselessTrueStuff';

mongoose.connect(connectionString, {connectTimeoutMS: 2000})
    .then ( () => console.log ('Database Connected'))
    .catch (error => console.log(error));