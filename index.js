const express = require('express');
const corsModule = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

const instamojo = require('./src/Instamojo/instamojoController');

app.use(express.json());
app.use(corsModule({origin: true}));
app.use(express.urlencoded({ extended: true }));
app.use('/instamojo',instamojo);

app.get("/", (req, res) => {
    res.status(200).send("Welcome to the Payment World!!");
});

app.listen(PORT, () => {
    console.log(`listening to port ${PORT}`);
})