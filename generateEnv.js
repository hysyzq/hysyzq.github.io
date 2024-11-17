const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create env.js content with the loaded variables
const envContent = `
window.GOOGLE_MAPS_API_KEY = '${process.env.GOOGLE_MAPS_API_KEY}';
window.GOOGLE_SHEET_API_KEY = '${process.env.GOOGLE_SHEET_API_KEY}';
`;

// Write to env.js file in back-to-kps folder
fs.writeFileSync(path.join(__dirname, 'back-to-kps', 'env.js'), envContent, 'utf8');
console.log('env.js file has been generated successfully.');
