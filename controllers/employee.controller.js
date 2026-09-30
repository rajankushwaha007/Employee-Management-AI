const employee = require("../models/employee.model")
const fs = require("fs")
const path = require("path")

async function homePage(req, res) {
    try {
        const search = req.query.search || ""
        const requestedPage = parseInt(req.query.page) || 1
        const success = req.query.success || ""
        const sort = req.query.sort || "newest"
        const sortNew = sort === "newest"
        const designationFilter = req.query.designation || ""
        const sortOld = sort === "oldest"
        const sortNameAsc = sort === "nameAsc"
        const sortNameDesc = sort === "nameDesc"
        const sortSalaryAsc = sort === "salaryAsc"
        const sortSalaryDesc = sort === "salaryDesc"

        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

        const limit = 5

        const searchFilter = search
            ? {
                $or: [
                    { name: { $regex: safeSearch, $options: "i" } },
                    { email: { $regex: safeSearch, $options: "i" } },
                    { phone: { $regex: safeSearch, $options: "i" } },
                    { designation: { $regex: safeSearch, $options: "i" } },
                    { city: { $regex: safeSearch, $options: "i" } },
                    { state: { $regex: safeSearch, $options: "i" } }
                ]
            }
            : {}

        if (designationFilter) {
            searchFilter.designation = designationFilter
        }

        const totalEmployees = await employee.countDocuments(searchFilter)

        const salaryStats = await employee.aggregate([
            {
                $group: {
                    _id: null,
                    totalSalary: { $sum: "$salary" },
                    averageSalary: { $avg: "$salary" }
                }
            }
        ])

        const totalSalary = salaryStats.length > 0
            ? salaryStats[0].totalSalary
            : 0

        const averageSalary = salaryStats.length > 0
            ? Math.round(salaryStats[0].averageSalary)
            : 0
        const formattedTotalSalary = Number(totalSalary).toLocaleString("en-IN")

        const formattedAverageSalary = Number(averageSalary).toLocaleString("en-IN")
        const designationStats = await employee.aggregate([
            {
                $group: {
                    _id: "$designation",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ])

        const designations = designationStats
            .map(item => item._id)
            .filter(item => item)

        const designationCounts = designationStats
            .map(item => item.count)

        const totalDesignations = designations.length
        const designationFlags = {}

        designations.forEach(item => {
            designationFlags[item] = item === designationFilter
        })
        const totalPages = Math.ceil(totalEmployees / limit)

        const page = totalPages > 0
            ? Math.min(Math.max(requestedPage, 1), totalPages)
            : 1

        const skip = (page - 1) * limit

        let sortOption = { createdAt: -1 }

        if (sort === "oldest") {
            sortOption = { createdAt: 1 }
        } else if (sort === "nameAsc") {
            sortOption = { name: 1 }
        } else if (sort === "nameDesc") {
            sortOption = { name: -1 }
        } else if (sort === "salaryAsc") {
            sortOption = { salary: 1 }
        } else if (sort === "salaryDesc") {
            sortOption = { salary: -1 }
        }

        let data = await employee
            .find(searchFilter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)

        data = data.map((item, index) => ({
            ...item.toObject(),
            serialNumber: skip + index + 1,
            displayEmployeeId: `EMP${String(skip + index + 1).padStart(3, "0")}`,
            formattedSalary: Number(item.salary).toLocaleString("en-IN")
        }))

        const pagination = []

        if (totalPages <= 7) {

            for (let i = 1; i <= totalPages; i++) {
                pagination.push({
                    number: i,
                    active: i === page,
                    dots: false
                })
            }

        } else {

            pagination.push({
                number: 1,
                active: page === 1,
                dots: false
            })

            if (page > 4) {
                pagination.push({
                    dots: true
                })
            }

            let start = Math.max(2, page - 1)
            let end = Math.min(totalPages - 1, page + 1)

            if (page <= 3) {
                start = 2
                end = 4
            }

            if (page >= totalPages - 2) {
                start = totalPages - 3
                end = totalPages - 1
            }

            for (let i = start; i <= end; i++) {
                pagination.push({
                    number: i,
                    active: i === page,
                    dots: false
                })
            }

            if (page < totalPages - 3) {
                pagination.push({
                    dots: true
                })
            }

            pagination.push({
                number: totalPages,
                active: page === totalPages,
                dots: false
            })
        }

        res.render("index.hbs", {
            data: data,
            search: search,
            success: success,
            sort: sort,
            sortNew: sortNew,
            sortOld: sortOld,
            sortNameAsc: sortNameAsc,
            sortNameDesc: sortNameDesc,
            sortSalaryAsc: sortSalaryAsc,
            sortSalaryDesc: sortSalaryDesc,
            designationFilter: designationFilter,
            designations: designations,
            designationFlags: designationFlags,
            designationCounts: designationCounts,

            totalEmployees: totalEmployees,
            totalSalary: formattedTotalSalary,
            averageSalary: formattedAverageSalary,
            totalDesignations: totalDesignations,

            currentPage: page,
            totalPages: totalPages,
            hasPrevious: page > 1,
            hasNext: page < totalPages,
            previousPage: page - 1,
            nextPage: page + 1,
            pagination: pagination
        })

    } catch (error) {
        console.log(error)

        res.render("index.hbs", {
            data: [],
            search: "",
            currentPage: 1,
            totalPages: 0,
            totalEmployees: 0,
            hasPrevious: false,
            hasNext: false,
            pagination: []
        })
    }
}

async function addPage(req, res) {
    res.render("add.hbs", {
        data: {},
        errorMessage: {}
    })
}


async function storePage(req, res) {
    try {
        const lastEmployee = await employee
            .findOne()
            .sort({ employeeId: -1 })

        let nextNumber = 1

        if (lastEmployee && lastEmployee.employeeId) {
            const lastNumber = parseInt(
                lastEmployee.employeeId.replace("EMP", "")
            )

            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1
            }
        }

        const employeeId = `EMP${String(nextNumber).padStart(3, "0")}`

        const data = new employee({

            ...req.body,

            employeeId: employeeId,

            photo: req.file
                ? `/uploads/employees/${req.file.filename}`
                : ""

        })

        await data.save()

        res.redirect("/?success=Employee added successfully")
    } catch (error) {
        console.log(error)

        let errorMessage = {}

        if (error.code === 11000 && error.keyPattern?.email) {
            errorMessage.email = "Email address already exists. Please use a different email address."
        } else if (error.errors) {
            errorMessage = Object.fromEntries(
                Object.keys(error.errors).map(key => [
                    key,
                    error.errors[key].message
                ])
            )
        } else {
            errorMessage.general = "Something went wrong. Please try again."
        }

        res.render("add.hbs", {
            data: req.body,
            errorMessage: errorMessage
        })
    }
}

async function detailsPage(req, res) {
    try {
        const data = await employee.findOne({
            _id: req.params._id
        })

        if (data) {

            const allEmployees = await employee
                .find({})
                .sort({ createdAt: 1 })
                .select("_id")

            const employeeIndex = allEmployees.findIndex(
                item => item._id.toString() === data._id.toString()
            )

            const displayEmployeeId = employeeIndex >= 0
                ? `EMP${String(employeeIndex + 1).padStart(3, "0")}`
                : "EMP000"

            res.render("details.hbs", {
                data: data,
                displayEmployeeId: displayEmployeeId
            })

        } else {
            res.redirect("/")
        }

    } catch (error) {
        console.log(error)
        res.redirect("/")
    }
}
async function editPage(req, res) {
    try {
        const data = await employee.findOne({
            _id: req.params._id
        })

        if (data) {
            res.render("edit.hbs", {
                data: data,
                errorMessage: {}
            })
        } else {
            res.redirect("/")
        }

    } catch (error) {
        console.log(error)
        res.redirect("/")
    }
}


async function updatePage(req, res) {
    try {
        const data = await employee.findOne({ _id: req.params._id })

        if (!data) {
            return res.redirect("/")
        }

        data.name = req.body.name
        data.email = req.body.email
        data.phone = req.body.phone
        data.designation = req.body.designation
        data.salary = req.body.salary
        data.city = req.body.city
        data.state = req.body.state

        // Update photo only when a new photo is selected
        if (req.file) {
            // Delete old photo from server
            if (data.photo) {
                const oldPhotoPath = path.join(
                    __dirname,
                    "..",
                    "public",
                    data.photo.replace(/^\//, "")
                )

                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath)
                }
            }

            // Save new photo path
            data.photo = `/uploads/employees/${req.file.filename}`
        }

        await data.save()

        res.redirect("/?success=Employee updated successfully")

    } catch (error) {

        console.log(error)

        let errorMessage = {}

        if (error.code === 11000 && error.keyPattern?.email) {
            errorMessage.email = "Email address already exists. Please use a different email address."
        } else if (error.errors) {
            errorMessage = Object.fromEntries(
                Object.keys(error.errors).map(key => [
                    key,
                    error.errors[key].message
                ])
            )
        } else {
            errorMessage.general = "Something went wrong. Please try again."
        }

        res.render("edit.hbs", {
            data: {
                ...req.body,
                _id: req.params._id,
                photo: data.photo
            },
            errorMessage
        })
    }
}

async function deletePage(req, res) {
    try {
        await employee.deleteOne({
            _id: req.params._id
        })

        res.redirect("/?success=Employee deleted successfully")

    } catch (error) {
        console.log(error)

        res.redirect("/?success=Employee deleted successfully")
    }
}

async function generateEmployeeIds(req, res) {
    try {
        const employees = await employee
            .find({
                $or: [
                    { employeeId: { $exists: false } },
                    { employeeId: null },
                    { employeeId: "" }
                ]
            })
            .sort({ createdAt: 1 })

        console.log("Old employees found:", employees.length)

        let nextNumber = 1

        const existingEmployees = await employee
            .find({
                employeeId: {
                    $regex: /^EMP[0-9]+$/
                }
            })
            .sort({ employeeId: -1 })

        if (existingEmployees.length > 0) {
            const numbers = existingEmployees
                .map(item => parseInt(item.employeeId.replace("EMP", "")))
                .filter(number => !isNaN(number))

            if (numbers.length > 0) {
                nextNumber = Math.max(...numbers) + 1
            }
        }

        for (const item of employees) {
            const newEmployeeId =
                `EMP${String(nextNumber).padStart(3, "0")}`

            await employee.updateOne(
                { _id: item._id },
                { $set: { employeeId: newEmployeeId } }
            )

            console.log(`${item.name} -> ${newEmployeeId}`)

            nextNumber++
        }

        res.redirect("/?success=Employee IDs generated successfully")

    } catch (error) {
        console.log("Employee ID Migration Error:", error)
        res.send("Something went wrong. Check terminal.")
    }
}
async function exportEmployees(req, res) {
    try {
        const employees = await employee
            .find({})
            .sort({ createdAt: 1 })

        let csv = "Employee ID,Name,Email,Phone,Designation,Salary,City,State\n"

        employees.forEach((item, index) => {

            const employeeId = item.employeeId
                ? item.employeeId
                : `EMP${String(index + 1).padStart(3, "0")}`

            csv += `"${employeeId}",`
            csv += `"${item.name || ""}",`
            csv += `"${item.email || ""}",`
            csv += `"${item.phone || ""}",`
            csv += `"${item.designation || ""}",`
            csv += `"${item.salary || 0}",`
            csv += `"${item.city || ""}",`
            csv += `"${item.state || ""}"\n`
        })

        res.setHeader("Content-Type", "text/csv")
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="employees.csv"'
        )

        res.send(csv)

    } catch (error) {
        console.log("CSV Export Error:", error)
        res.status(500).send("Unable to export employee records")
    }
}
module.exports = {
    homePage,
    addPage,
    storePage,
    deletePage,
    editPage,
    updatePage,
    detailsPage,
    generateEmployeeIds,
    exportEmployees
}