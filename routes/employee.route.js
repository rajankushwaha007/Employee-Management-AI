const EmployeeRouter = require("express").Router()

const encoder = require("../middleware/bodyParser.middleware")
const employeeUpload = require("../middleware/employeeUpload.middleware")

const {
    homePage,
    addPage,
    storePage,
    deletePage,
    editPage,
    updatePage,
    detailsPage,
    generateEmployeeIds,
    exportEmployees
} = require("../controllers/employee.controller")

EmployeeRouter.get("", homePage)
EmployeeRouter.get("/add", addPage)
EmployeeRouter.post("/store", encoder, employeeUpload.single("photo"), storePage)
EmployeeRouter.post("/delete/:_id", deletePage)
EmployeeRouter.get("/edit/:_id", editPage)
EmployeeRouter.get("/details/:_id", detailsPage)
EmployeeRouter.post("/update/:_id", employeeUpload.single("photo"), encoder, updatePage)
EmployeeRouter.get("/generate-employee-ids", generateEmployeeIds)
EmployeeRouter.get("/export", exportEmployees)

module.exports = EmployeeRouter