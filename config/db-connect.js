require("mongoose")
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Database is Connected")
    })
    .catch(error => {
        console.log("Database Connection Error:", error)
    })