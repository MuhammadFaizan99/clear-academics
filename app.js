require("dotenv").config()
const express = require("express")
const app = express()
const PORT = process.env.PORT || 3000
const bodyParser = require("body-parser")
const cors = require("cors")
const colors = require("colors")
const {enrollRouter} = require("./routes/enrollRoutes")

// middleware
app.use(bodyParser.urlencoded({extended : false}))
app.use(bodyParser.json())
app.use(cors())

// Routes
app.use("/",enrollRouter)

// Server connection
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`.bgGreen.white)
})