const Router = require("express").Router()

const EmployeeRouter = require("./employee.route")
const AIRouter = require("./ai.route")

Router.use("/", EmployeeRouter)
Router.use("/ai", AIRouter)

module.exports = Router