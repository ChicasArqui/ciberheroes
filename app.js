const express = require('express')
const app = express()

// Endpoint principal
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Pipeline CI/CD funcionando',
        env: 'dev'
    })
})

// Smoke test endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' })
})

module.exports = app