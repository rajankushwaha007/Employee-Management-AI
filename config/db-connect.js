require("mongoose")
.connect("mongodb://localhost:27017/First")
.then(()=>{
    console.log("Database is Connected")
})
.catch(error=>{
    console.log(error)
})