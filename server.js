const express = require('express');
const XLSX = require('xlsx');
const app = express();
const port = 5000;

app.get('/guests', (req, res) => {
    const workbook = XLSX.readFile('data.xlsx')
    const sheetName = "GUEST LIST"
    const worksheet = workbook.Sheets[sheetName]
    const guests = XLSX.utils.sheet_to_json(worksheet);
    res.status(200).json(guests)
})

app.get('/invitation', (req, res) => {
    const { otp } = req.query;

    const workbook = XLSX.readFile('data.xlsx');
    const sheetName = "GUEST LIST";
    const worksheet = workbook.Sheets[sheetName];
    const guests = XLSX.utils.sheet_to_json(worksheet);

    // Filter guests based on the otp
    const guest = guests.find(guest => guest.OTP === parseInt(otp));

    res.status(200).json(guest);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})