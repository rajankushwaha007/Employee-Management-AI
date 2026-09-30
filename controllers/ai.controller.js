const { GoogleGenAI } = require("@google/genai")
const employee = require("../models/employee.model")

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})

async function aiAssistant(req, res) {
    try {
        const { prompt } = req.body

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter a question"
            })
        }

        const employees = await employee.find({}).lean()

        const employeeData = employees.map((item) => ({
            employeeId: item.employeeId,
            name: item.name,
            email: item.email,
            phone: item.phone,
            designation: item.designation,
            salary: item.salary,
            city: item.city,
            state: item.state
        }))

        const systemPrompt = `
You are an AI assistant for an Employee Management System.

Use ONLY the employee data provided below to answer the user's question.

Employee Data:
${JSON.stringify(employeeData, null, 2)}

Rules:
- Do not invent employee information.
- If the requested information is not available, clearly say so.
- Keep answers simple and professional.
- For salary questions, use Indian Rupee format when appropriate.

User Question:
${prompt}
`

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: systemPrompt
        })

        res.json({
            success: true,
            answer: response.text
        })

    } catch (error) {
        console.log("AI Assistant Error:", error)

        res.status(500).json({
            success: false,
            message: "Unable to process AI request"
        })
    }
}

module.exports = {
    aiAssistant
}