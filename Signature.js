require('dotenv').config();

const mysql = require('mysql2/promise'); // Use mysql2 for promises
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Database connection settings loaded from .env
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

// Folder path to save images
const outputFolder = 'F:\\KCBL-SIGNATURE\\SignatureImages';

const missingSignatureImage = 'C:\\Users\\naeem.ullah\\Desktop\\Signature\\SignatureNotFound.jpg';


const imageWidth = 400; // Change to the desired width
const imageHeight = 200; // Change to the desired height

async function signaturePhotos() {
    try {
        // Create a connection to the database
        const connection = await mysql.createConnection(dbConfig);

        // Query to retrieve image data and Customer_ID from signaturephoto, ordered by Customer_ID
        const query = 'SELECT Customer_ID, Signature FROM signaturephoto ORDER BY Customer_ID';
        const [rows] = await connection.execute(query);

        // Ensure the output folder exists
        fs.mkdirSync(outputFolder, { recursive: true });

        // Define the starting Customer_ID
        let startingCustomerID = rows[0] ? rows[0].Customer_ID : 1;

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            const Customer_ID = row.Customer_ID;
            const signature = row.Signature;

            let imageBuffer;

            if (signature === null) {
                // Use the missing signature image for null signatures
                imageBuffer = fs.readFileSync(missingSignatureImage);
            } else {
                // Resize the image before saving
                imageBuffer = await sharp(signature)
                    .resize(imageWidth, imageHeight)
                    .toBuffer();
            }

            // Modify the file naming to include a hyphen
            const paddedCustomerID = `${Customer_ID.toString().padStart(2, '0')}-00`;
            const imagePath = path.join(outputFolder, `${paddedCustomerID}.jpg`);

            await fs.promises.writeFile(imagePath, imageBuffer);
            console.log('Image saved on SignaturePhotos Folder:', imagePath);

            // Increment the startingCustomerID if there's a gap in Customer_IDs
            if (Customer_ID !== startingCustomerID + index) {
                startingCustomerID = Customer_ID - index;
            }
        }

        // Close the database connection
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

signaturePhotos();
