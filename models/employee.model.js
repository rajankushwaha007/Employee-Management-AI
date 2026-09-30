const mongoose = require("mongoose")

const EmployeeSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            unique: true
        },
        name: {
            type: String,
            required: [true, "Name Field is Mandatory"],
            trim: true,
            minlength: [2, "Name must contain at least 2 characters"]
        },

        email: {
            type: String,
            required: [true, "Email Address Field is Mandatory"],
            trim: true,
            lowercase: true,
            unique: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
        },

        phone: {
            type: String,
            required: [true, "Phone Number Field is Mandatory"],
            trim: true,
            match: [/^[0-9]{10}$/, "Phone number must contain exactly 10 digits"]
        },

        designation: {
            type: String,
            required: [true, "Designation Field is Mandatory"],
            trim: true
        },

        salary: {
            type: Number,
            required: [true, "Salary Field is Mandatory"],
            min: [0, "Salary cannot be negative"]
        },

        city: {
            type: String,
            trim: true,
            default: ""
        },

        state: {
            type: String,
            trim: true,
            default: ""
        },
        photo: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
)

const Employee = mongoose.model("Employee", EmployeeSchema)

module.exports = Employee