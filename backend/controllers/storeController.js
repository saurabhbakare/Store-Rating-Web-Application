const db = require('../config/db');

// Get all stores with user-specific rating data
async function getUserStoresList(req, res) {
  const userId = req.user.id;
  const { name, address, sortBy = 'name', order = 'ASC', page = 1, limit = 10 } = req.query;

  try {
    let queryStr = `
      SELECT s.id, s.name, s.email, s.address,
             COALESCE((SELECT AVG(r.rating) FROM ratings r WHERE r.store_id = s.id), 0) AS overall_rating,
             (SELECT r2.rating FROM ratings r2 WHERE r2.store_id = s.id AND r2.user_id = ?) AS user_rating
      FROM stores s
      WHERE 1=1
    `;
    const params = [userId];

    if (name) {
      queryStr += ' AND s.name LIKE ?';
      params.push(`%${name}%`);
    }
    if (address) {
      queryStr += ' AND s.address LIKE ?';
      params.push(`%${address}%`);
    }

    // Sorting
    const validSortFields = ['name', 'address', 'overall_rating', 'user_rating'];
    let sortField = 's.name';
    if (sortBy === 'overall_rating') {
      sortField = 'overall_rating';
    } else if (sortBy === 'user_rating') {
      sortField = 'user_rating';
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
    console.error('Get User Stores List Error:', error);
    return res.status(500).json({ message: 'Server error retrieving stores list.' });
  }
}

// Submit or Modify Rating (1 to 5)
async function submitOrModifyRating(req, res) {
  const userId = req.user.id;
  const storeId = req.params.id;
  const { rating } = req.body;

  const ratingVal = parseInt(rating);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    // Check if store exists
    const [stores] = await db.query('SELECT id FROM stores WHERE id = ?', [storeId]);
    if (stores.length === 0) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    // Upsert rating (ON DUPLICATE KEY UPDATE)
    await db.query(`
      INSERT INTO ratings (user_id, store_id, rating) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE rating = VALUES(rating)
    `, [userId, storeId, ratingVal]);

    return res.status(200).json({ message: 'Rating submitted successfully.' });
  } catch (error) {
    console.error('Submit Rating Error:', error);
    return res.status(500).json({ message: 'Server error while submitting rating.' });
  }
}

// Get Store Owner Dashboard stats and rater list
async function getOwnerDashboard(req, res) {
  const ownerId = req.user.id;
  const { sortBy = 'name', order = 'ASC' } = req.query;

  try {
    // 1. Find the store owned by the user
    const [stores] = await db.query('SELECT * FROM stores WHERE owner_id = ?', [ownerId]);
    if (stores.length === 0) {
      return res.status(404).json({ message: 'You do not have a store registered on the platform.' });
    }

    const store = stores[0];
    const storeId = store.id;

    // 2. Get average rating and count
    const [[ratingStats]] = await db.query(`
      SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total_ratings 
      FROM ratings 
      WHERE store_id = ?
    `, [storeId]);

    // 3. Get list of users who rated
    let raterQueryStr = `
      SELECT u.id, u.name, u.email, u.address, r.rating, r.created_at
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
    `;

    const validSortFields = ['name', 'email', 'rating', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? `u.${sortBy}` : 'u.name';
    let sqlSortField = sortField;
    if (sortBy === 'rating') sqlSortField = 'r.rating';
    if (sortBy === 'created_at') sqlSortField = 'r.created_at';
    
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    raterQueryStr += ` ORDER BY ${sqlSortField} ${sortOrder}`;

    const [raters] = await db.query(raterQueryStr, [storeId]);

    return res.status(200).json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        averageRating: parseFloat(ratingStats.avg_rating).toFixed(1),
        totalRatings: ratingStats.total_ratings,
      },
      raters,
    });
  } catch (error) {
    console.error('Get Owner Dashboard Error:', error);
    return res.status(500).json({ message: 'Server error retrieving dashboard details.' });
  }
}

module.exports = {
  getUserStoresList,
  submitOrModifyRating,
  getOwnerDashboard,
};
