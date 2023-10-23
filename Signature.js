require('dotenv').config();

const mysql = require('mysql2/promise'); // Use mysql2 for promises
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const kleur = require('kleur');

// Database connection settings loaded from .env
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

const outputFolder = process.env.OUTPUT_FOLDER;

const missingSignatureImage = 'C:\\Users\\naeem.ullah\\Desktop\\Signature\\SignatureNotFound.jpg';

const imageWidth = 400; // Change to the desired width
const imageHeight = 200; // Change to the desired height

async function signaturePhotos() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        const query = 'SELECT Customer_ID, Signature FROM signaturephoto ORDER BY Customer_ID';
        const [rows] = await connection.execute(query);
        fs.mkdirSync(outputFolder, { recursive: true });

        let startingCustomerID = rows[0] ? rows[0].Customer_ID : 1;

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            const Customer_ID = row.Customer_ID;
            const signature = row.Signature;

            let imageBuffer;

            if (signature === null) {
                imageBuffer = fs.readFileSync(missingSignatureImage);
            } else {
                imageBuffer = await sharp(signature)
                    .resize(imageWidth, imageHeight)
                    .toBuffer();
            }

            const paddedCustomerID = `${Customer_ID.toString().padStart(2, '0')}-00`;
            const imagePath = path.join(outputFolder, `${paddedCustomerID}.jpg`);

            await fs.promises.writeFile(imagePath, imageBuffer);
            console.log(kleur.green('Image saved on SignaturePhotos Folder:'));
            console.log(kleur.blue(imagePath));

            if (Customer_ID !== startingCustomerID + index) {
                startingCustomerID = Customer_ID - index;
            }
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

signaturePhotos();
