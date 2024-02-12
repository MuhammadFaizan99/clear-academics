const express = require("express")
const enrollRouter = express.Router()
const {createEnrollment} = require("../controller/enroll")

enrollRouter.post("/create-enrollment",createEnrollment)
module.exports = {enrollRouter}