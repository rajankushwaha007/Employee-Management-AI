require("dotenv").config()

const express = require("express")
const Router = require("./routes/index.route")
const hbs = require("hbs")
require("./config/db-connect")

const app = express()

hbs.registerPartials("./views/partials")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static("public"))

app.use("", Router)

app.listen(8000, () => {
    console.log("Server is Runnig at http://localhost:8000")
})