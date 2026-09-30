const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "public/uploads/employees")

    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname)

        cb(null, uniqueName)

    }

})

const fileFilter = function (req, file, cb) {

    const allowedTypes = /jpeg|jpg|png|webp/

    const extension = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    )

    const mimeType = allowedTypes.test(file.mimetype)

    if (extension && mimeType) {

        cb(null, true)

    } else {

        cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed"))

    }

}

const employeeUpload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024
    }

})

module.exports = employeeUpload