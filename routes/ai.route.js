const AIRouter = require("express").Router()

const {
    aiAssistant
} = require("../controllers/ai.controller")


AIRouter.get("", (req, res) => {
    res.render("ai.hbs")
})


AIRouter.post("/ask", aiAssistant)


module.exports = AIRouter