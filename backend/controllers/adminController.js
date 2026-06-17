const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function getDashboardStats(req, res) {
  try {
    const [[usersCount]] = await db.query('SELECT COUNT(*) as total FROM users');
    const [[storesCount]] = await db.query('SELECT COUNT(*) as total FROM stores');
    const [[ratingsCount]] = await db.query('SELECT COUNT(*) as total FROM ratings');

    return res.status(200).json({
      totalUsers: usersCount.total,
      totalStores: storesCount.total,
      totalRatings: ratingsCount.total,
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    return res.status(500).json({ message: 'Server error retrieving dashboard statistics.' });
  }
}

async function getUsersList(req, res) {
  const { name, email, address, role, sortBy = 'name', order = 'ASC', page = 1, limit = 10 } = req.query;

  try {
    let queryStr = `
      SELECT u.id, u.name, u.email, u.address, u.role, 
             s.id AS store_id, s.name AS store_name, s.email AS store_email, s.address AS store_address,
             (SELECT AVG(r.rating) FROM ratings r WHERE r.store_id = s.id) AS store_rating
      FROM users u
      LEFT JOIN stores s ON u.id = s.owner_id
      WHERE 1=1
    `;
    const params = [];

    if (name) {
      queryStr += ' AND u.name LIKE ?';
      params.push(`%${name}%`);
    }
    if (email) {
      queryStr += ' AND u.email LIKE ?';
      params.push(`%${email}%`);
    }
    if (address) {
      queryStr += ' AND u.address LIKE ?';
      params.push(`%${address}%`);
    }
    if (role) {
      queryStr += ' AND u.role = ?';
      params.push(role);
    }

    // Sorting
    const validSortFields = ['name', 'email', 'address', 'role'];
    const sortField = validSortFields.includes(sortBy) ? `u.${sortBy}` : 'u.name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    queryStr += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    const limitVal = parseInt(limit) || 10;
    const pageVal = parseInt(page) || 1;
    const offset = (pageVal - 1) * limitVal;
    
    // Get total count for pagination headers/meta
    let countQueryStr = 'SELECT COUNT(*) as total FROM users u WHERE 1=1';
    const countParams = [];
    if (name) {
      countQueryStr += ' AND u.name LIKE ?';
      countParams.push(`%${name}%`);
    }
    if (email) {
      countQueryStr += ' AND u.email LIKE ?';
      countParams.push(`%${email}%`);
    }
    if (address) {
      countQueryStr += ' AND u.address LIKE ?';
      countParams.push(`%${address}%`);
    }
    if (role) {
      countQueryStr += ' AND u.role = ?';
      countParams.push(role);
    }
    
    const [[countResult]] = await db.query(countQueryStr, countParams);
    
    queryStr += ' LIMIT ? OFFSET ?';
    params.push(limitVal, offset);

    const [users] = await db.query(queryStr, params);

    return res.status(200).json({
      data: users,
      meta: {
        total: countResult.total,
        page: pageVal,
        limit: limitVal,
        totalPages: Math.ceil(countResult.total / limitVal),
      }
    });
  } catch (error) {
    console.error('Get Users List Error:', error);
    return res.status(500).json({ message: 'Server error retrieving users list.' });
  }
}

async function getStoresList(req, res) {
  const { name, email, address, sortBy = 'name', order = 'ASC', page = 1, limit = 10 } = req.query;

  try {
    let queryStr = `
      SELECT s.id, s.name, s.email, s.address, s.owner_id,
             u.name AS owner_name,
             COALESCE(AVG(r.rating), 0) AS overall_rating
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE 1=1
    `;
    const params = [];

    if (name) {
      queryStr += ' AND s.name LIKE ?';
      params.push(`%${name}%`);
    }
    if (email) {
      queryStr += ' AND s.email LIKE ?';
      params.push(`%${email}%`);
    }
    if (address) {
      queryStr += ' AND s.address LIKE ?';
      params.push(`%${address}%`);
    }

    queryStr += ' GROUP BY s.id';

    // Sorting
    const validSortFields = ['name', 'email', 'address', 'overall_rating'];
    let sortField = 's.name';
    if (sortBy === 'overall_rating') {
      sortField = 'overall_rating';
    } else if (validSortFields.includes(sortBy)) {
      sortField = `s.${sortBy}`;
    }
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    queryStr += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    const limitVal = parseInt(limit) || 10;
    const pageVal = parseInt(page) || 1;
    const offset = (pageVal - 1) * limitVal;

    // Count query
    let countQueryStr = 'SELECT COUNT(*) as total FROM stores s WHERE 1=1';
    const countParams = [];
    if (name) {
      countQueryStr += ' AND s.name LIKE ?';
      countParams.push(`%${name}%`);
    }
    if (email) {
      countQueryStr += ' AND s.email LIKE ?';
      countParams.push(`%${email}%`);
    }
    if (address) {
      countQueryStr += ' AND s.address LIKE ?';
      countParams.push(`%${address}%`);
    }

    const [[countResult]] = await db.query(countQueryStr, countParams);

    queryStr += ' LIMIT ? OFFSET ?';
    params.push(limitVal, offset);

    const [stores] = await db.query(queryStr, params);

    return res.status(200).json({
      data: stores,
      meta: {
        total: countResult.total,
        page: pageVal,
        limit: limitVal,
        totalPages: Math.ceil(countResult.total / limitVal),
      }
    });
  } catch (error) {
    console.error('Get Stores List Error:', error);
    return res.status(500).json({ message: 'Server error retrieving stores list.' });
  }
}

async function addUser(req, res) {
  const { name, email, password, address, role } = req.body;

  try {
    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    if (role === 'store_owner') {
      return res.status(400).json({ 
        message: 'To create a Store Owner, please use the Add Store option to associate them with a store.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, address, role]
    );

    return res.status(201).json({
      message: 'User created successfully.',
      userId: result.insertId,
    });
  } catch (error) {
    console.error('Admin Add User Error:', error);
    return res.status(500).json({ message: 'Server error while creating user.' });
  }
}

async function addStore(req, res) {
  const { 
    name, email, address, 
    ownerName, ownerEmail, ownerPassword, ownerAddress 
  } = req.body;

  const pool = db.getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Check if store email exists
    const [storeCheck] = await conn.query('SELECT id FROM stores WHERE email = ?', [email]);
    if (storeCheck.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Store email is already registered.' });
    }

    // 2. Check if owner email exists
    const [ownerCheck] = await conn.query('SELECT id FROM users WHERE email = ?', [ownerEmail]);
    if (ownerCheck.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Owner email is already registered.' });
    }

    // 3. Create Owner User
    const hashedOwnerPassword = await bcrypt.hash(ownerPassword, 10);
    const [ownerResult] = await conn.query(`
      INSERT INTO users (name, email, password, address, role) 
      VALUES (?, ?, ?, ?, 'store_owner')
    `, [ownerName, ownerEmail, hashedOwnerPassword, ownerAddress]);

    const ownerId = ownerResult.insertId;

    // 4. Create Store
    const [storeResult] = await conn.query(`
      INSERT INTO stores (name, email, address, owner_id) 
      VALUES (?, ?, ?, ?)
    `, [name, email, address, ownerId]);

    await conn.commit();

    return res.status(201).json({
      message: 'Store and Owner created successfully.',
      storeId: storeResult.insertId,
      ownerId: ownerId,
    });
  } catch (error) {
    await conn.rollback();
    console.error('Admin Add Store Error:', error);
    return res.status(500).json({ message: 'Server error while creating store and owner.' });
  } finally {
    conn.release();
  }
}

module.exports = {
  getDashboardStats,
  getUsersList,
  getStoresList,
  addUser,
  addStore,
};
