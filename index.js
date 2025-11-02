const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000; // On this port app will run

// Get config from environment variables
const {
  APP_COLOR,
  APP_VERSION,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME
} = process.env;

// Database connection pool
const dbPool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to create table if it doesn't exist
const initializeDatabase = async () => {
  try {
    const connection = await dbPool.getConnection();
    console.log('Connected to database, ensuring table exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    connection.release();
    console.log('Table "visitors" is ready.');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

// Define Routes
// Root route: Shows the colored page and visitor count
app.get('/', async (req, res) => {
  try {
    // Log this visit to the database
    await dbPool.query('INSERT INTO visitors () VALUES ()');

    // Get total visitor count
    const [results] = await dbPool.query('SELECT COUNT(*) as count FROM visitors');
    const visitorCount = results[0].count;

    // Send the HTML response
    res.send(`
      <html style="background-color: ${APP_COLOR || 'white'}; color: #333;">
        <head><title>Blue/Green App</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h1>Hello!</h1>
          <h2>This is version: ${APP_VERSION || 'v2.0'}</h2>
          <h2>My color is: ${APP_COLOR || 'N/A'}</h2>
          <p>(This page has been visited ${visitorCount} times by all versions)</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error handling / request:', err);
    res.status(500).send('Error connecting to the database');
  }
});

// Health check route for the Load Balancer
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(port, async () => {
  await initializeDatabase();
  console.log(`App (Version: ${APP_VERSION}, Color: ${APP_COLOR}) listening on port ${port}`);
});