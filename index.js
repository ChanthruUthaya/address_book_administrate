const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json()) //parse json data
app.use(express.urlencoded({extended: false})) //parse url encoded data

app.use(express.static(path.join(__dirname, 'public'))); //static page serving Use to include middleware 'public' is static folder

app.use('/db', require('./routes/db_handler.js')); //route to database handler functions
 
app.get('*', (req, res) => {
    res.status(404).send("Could not find page"); //if page cannont be found (route not handled)
})


app.listen(PORT, () => console.log("listening on port: " + PORT)); //expose app on PORT 