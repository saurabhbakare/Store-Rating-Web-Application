const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
};

let pool;

async function initializeDatabase() {
  console.log('Connecting to MySQL server for initialization...');
  
  // 1. Initial connection without selecting database to check/create it
  const initConnection = await mysql.createConnection(dbConfig);
  
  const dbName = process.env.DB_NAME || 'store_rating_db';
  await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  console.log(`Database "${dbName}" checked/created.`);
  await initConnection.end();

  // 2. Re-connect directly to the target database
  const connection = await mysql.createConnection({
    ...dbConfig,
    database: dbName
  });

  console.log('Creating database tables if they do not exist...');

  // Create Users table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      address VARCHAR(400) NOT NULL,
      role ENUM('admin', 'user', 'store_owner') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Create Stores table (has 1:1 relationship with a store owner user)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      address VARCHAR(400) NOT NULL,
      owner_id INT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Create Ratings table (many-to-many relationship users and stores)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      store_id INT NOT NULL,
      rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_store (user_id, store_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('Database tables verified.');

  // 3. Seeding default accounts if users table is empty
  const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
  if (rows[0].count === 0) {
    console.log('No users found in database. Seeding initial test accounts...');

    const saltRounds = 10;
    const adminPasswordHash = await bcrypt.hash('Password123!', saltRounds);
    const userPasswordHash = await bcrypt.hash('Password123!', saltRounds);
    const ownerPasswordHash = await bcrypt.hash('Password123!', saltRounds);

    // Seed Admin
    const [adminResult] = await connection.query(`
      INSERT INTO users (name, email, password, address, role) 
      VALUES (
        'System Administrator Account Primary', 
        'admin@storerating.com', 
        ?, 
        '123 Admin Headquarter Boulevard, Tech City, 99999', 
        'admin'
      )
    `, [adminPasswordHash]);

    // Seed Normal User
    await connection.query(`
      INSERT INTO users (name, email, password, address, role) 
      VALUES (
        'Regular Tester User Account', 
        'user@storerating.com', 
        ?, 
        '456 Residential Avenue, Green Valley, 88888', 
        'user'
      )
    `, [userPasswordHash]);

    const storesToSeed = [
      {
        storeName: 'The Delicious Gourmet Bakery Shop',
        storeEmail: 'bakery@storerating.com',
        storeAddress: '789 Gourmet Plaza, Foodie District, 77777',
        ownerName: 'Delicious Bakery Owner User',
        ownerEmail: 'owner@storerating.com',
        ownerAddress: '789 Gourmet Plaza, Foodie District, 77777'
      },
      {
        storeName: 'Gourmet Coffee & Roast House',
        storeEmail: 'coffee@storerating.com',
        storeAddress: '101 Espresso Lane, Cafe District, Tech City, 90001',
        ownerName: 'Master Barista Coffee Owner',
        ownerEmail: 'barista@storerating.com',
        ownerAddress: '101 Espresso Lane, Cafe District, Tech City, 90001'
      },
      {
        storeName: 'Traditional Italian Pasta Kitchen',
        storeEmail: 'pasta@storerating.com',
        storeAddress: '202 Olive Oil Boulevard, Little Italy, Tech City, 90002',
        ownerName: 'Luigi Mario Chef Pasta Owner',
        ownerEmail: 'luigi@storerating.com',
        ownerAddress: '202 Olive Oil Boulevard, Little Italy, Tech City, 90002'
      },
      {
        storeName: 'Organic Green Smoothie Bistro',
        storeEmail: 'smoothie@storerating.com',
        storeAddress: '303 Wellness Parkway, Health District, Tech City, 90003',
        ownerName: 'Healthy Green Smoothie Owner',
        ownerEmail: 'smoothieowner@storerating.com',
        ownerAddress: '303 Wellness Parkway, Health District, Tech City, 90003'
      },
      {
        storeName: 'Sweet Velvet Cupcake Bakery',
        storeEmail: 'cupcakes@storerating.com',
        storeAddress: '404 Sugar Street, Dessert Plaza, Tech City, 90004',
        ownerName: 'Sweet Cupcake Designer Owner',
        ownerEmail: 'cupcakeowner@storerating.com',
        ownerAddress: '404 Sugar Street, Dessert Plaza, Tech City, 90004'
      }
    ];

    for (const item of storesToSeed) {
      const [ownerRes] = await connection.query(`
        INSERT INTO users (name, email, password, address, role) 
        VALUES (?, ?, ?, ?, 'store_owner')
      `, [item.ownerName, item.ownerEmail, ownerPasswordHash, item.ownerAddress]);

      await connection.query(`
        INSERT INTO stores (name, email, address, owner_id) 
        VALUES (?, ?, ?, ?)
      `, [item.storeName, item.storeEmail, item.storeAddress, ownerRes.insertId]);
    }

    console.log('Successfully seeded database with admin, user, store owner, and store!');
  } else {
    console.log('Database already populated. Skipping seeding.');
  }

  await connection.end();

  // 4. Initialize persistent pool for the Express application to use
  pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  return pool;
}

module.exports = {
  initializeDatabase,
  getPool: () => {
    if (!pool) {
      throw new Error('Database pool has not been initialized. Call initializeDatabase first.');
    }
    return pool;
  },
  query: (sql, params) => {
    if (!pool) {
      throw new Error('Database pool has not been initialized. Call initializeDatabase first.');
    }
    return pool.query(sql, params);
  }
};
