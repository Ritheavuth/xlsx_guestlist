require('dotenv').config();

const express = require('express');
const app = express();


const port = 5000;

const { google } = require('googleapis');

const sheetId = process.env.GOOGLE_SHEET_ID;
const tabName = 'guests';
const range = 'A:D';

console.log(sheetId)

async function getGoogleSheetClient() {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY,
            },
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/spreadsheets'
            ]
        });
        const authClient = await auth.getClient();
        return google.sheets({
            version: 'v4',
            auth: authClient,
        });
    } catch (error) {
        throw new Error(`Failed to get Google Sheets client: ${error.message}`);
    }
}



app.get('/guests', async (req, res) => {
    try {
        const googleSheetClient = await getGoogleSheetClient();
        const response = await googleSheetClient.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${tabName}!${range}`,
        });

        // Extracting values from the response
        const values = response.data.values;

        // Array to hold grouped objects
        const groupedObjects = [];

        // Assuming the first row contains headers
        const headers = values[0];

        // Loop through each row starting from index 1 to skip headers
        for (let i = 0; i < values.length; i++) {
            const row = values[i];
            const rowData = {};

            // Loop through each column and create key-value pairs
            for (let j = 0; j < headers.length; j++) {
                // Check if the current column has a value in the row
                if (row[j]) {
                    rowData[headers[j]] = row[j];
                } else {
                    // If no value exists, set it to an empty string
                    rowData[headers[j]] = "";
                }
            }

            // Push the row data as an object into the groupedObjects array
            groupedObjects.push(rowData);
        }

        // Send the grouped objects as JSON response
        res.status(200).json(groupedObjects);
    } catch (error) {
        console.error("Error retrieving data from Google Sheets:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/invitation', async (req, res) => {
    try {
        // Extract UID from query parameters
        const uid = req.query.uid;

        // Retrieve data from Google Sheets to find the guest information corresponding to the UID
        const googleSheetClient = await getGoogleSheetClient();
        const response = await googleSheetClient.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${tabName}!${range}`,
        });

        // Extracting values from the response
        const values = response.data.values;

        const uids = values.map(row => row[0]);

        const uidIndex = uids.indexOf(uid);

        // Check if the UID exists in the UIDs array
        if (uidIndex !== -1) {
            // Get the corresponding guest information
            const guestInfo = values[uidIndex];

            // If guest information exists, return success response
            if (guestInfo) {
                // Assuming the guest information is in JSON format, you can structure it accordingly
                const headers = values[0];
                const guestObject = {};
                for (let i = 0; i < headers.length; i++) {
                    guestObject[headers[i]] = guestInfo[i] || ""; // Set to empty string if data is missing
                }
                res.status(200).json(guestObject);
            } else {
                // If guest information is missing, return error response
                res.status(404).json({ success: false, message: "Guest information not found for the provided UID" });
            }
        } else {
            // If UID is not found, return error response
            res.status(404).json({ success: false, message: "Invalid UID" });
        }
    } catch (error) {
        console.error("Error retrieving data from Google Sheets:", error);
        res.status(500).send("Internal Server Error");
    }
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})