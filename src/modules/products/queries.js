const { query, getClient } = require('../../config/db')

// ─── helpers ───────────────────────────────────────────────────

const slugify = (str) =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const buildProductListQuery = ({
  search, categoryId, minPrice, maxPrice,
  inStock, sort, cursorDate, cursorId, limit
}) => {
  const values = []
  const conditions = ['p.is_active = true']
  let i = 1

  // full-text search using tsvector
  let searchRank = 'NULL'
  if (search) {
    values.push(search)
    conditions.push(`p.search_vector @@ plainto_tsquery('english', $${i})`)
    searchRank = `ts_rank(p.search_vector, plainto_tsquery('english', $${i}))`
    i++
  }

  if (categoryId) {
    values.push(categoryId)
    conditions.push(`p.category_id = $${i}`)
    i++
  }

  if (minPrice) {
    values.push(Number(minPrice))
    conditions.push(`p.price >= $${i}`)
    i++
  }

  if (maxPrice) {
    values.push(Number(maxPrice))
    conditions.push(`p.price <= $${i}`)
    i++
  }

  if (inStock === 'true') {
    conditions.push(`p.stock > 0`)
  }

  // cursor pagination — no OFFSET
  if (cursorDate && cursorId) {
    values.push(cursorDate)
    values.push(cursorId)
    conditions.push(`(p.created_at, p.id) < ($${i}, $${i + 1})`)
    i += 2
  }

  // dynamic ORDER BY
  const orderMap = {
    price_asc:  'p.price ASC, p.created_at DESC',
    price_desc: 'p.price DESC, p.created_at DESC',
    rating:     'avg_rating DESC, p.created_at DESC',
    newest:     'p.created_at DESC',
  }
  const orderBy = orderMap[sort] || 'p.created_at DESC'

  const pageLimit = Math.min(Number(limit) || 20, 50)
  values.push(pageLimit)

  const sql = `
    SELECT
      p.id, p.name, p.slug, p.description, p.price, p.stock,
      p.category_id, p.seller_id, p.is_active, p.created_at,
      c.name          AS category_name,
      u.name          AS seller_name,
      COALESCE(AVG(r.rating), 0)::NUMERIC(3,2) AS avg_rating,
      COUNT(DISTINCT r.id)::INT                AS review_count,
      MIN(pi.url)                              AS thumbnail,
      ${searchRank}                            AS search_rank
    FROM products p
    LEFT JOIN categories c  ON p.category_id = c.id
    LEFT JOIN users u        ON p.seller_id   = u.id
    LEFT JOIN reviews r      ON r.product_id  = p.id
    LEFT JOIN product_images pi ON pi.product_id = p.id
      AND pi.sort_order = 0
    WHERE ${conditions.join(' AND ')}
    GROUP BY p.id, c.name, u.name
    ORDER BY ${orderBy}
    LIMIT $${i}
  `

  return { sql, values }
}

const getProducts = async (filters) => {
  const { sql, values } = buildProductListQuery(filters)
  const { rows } = await query(sql, values)
  return rows
}

const findProductBySlug = async (slug) => {
  const { rows } = await query(`
    SELECT
      p.*,
      c.name  AS category_name,
      u.name  AS seller_name,
      COALESCE(AVG(r.rating), 0)::NUMERIC(3,2) AS avg_rating,
      COUNT(DISTINCT r.id)::INT                AS review_count,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object('url', pi.url, 'sort_order', pi.sort_order)
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS images
    FROM products p
    LEFT JOIN categories c      ON p.category_id  = c.id
    LEFT JOIN users u            ON p.seller_id    = u.id
    LEFT JOIN reviews r          ON r.product_id   = p.id
    LEFT JOIN product_images pi  ON pi.product_id  = p.id
    WHERE p.slug = $1 AND p.is_active = true
    GROUP BY p.id, c.name, u.name
  `, [slug])
  return rows[0] || null
}

const findProductById = async (id) => {
  const { rows } = await query(
    `SELECT * FROM products WHERE id = $1`,
    [id]
  )
  return rows[0] || null
}

const createProduct = async ({ name, description, price, stock, categoryId, sellerId }) => {
  const slug = slugify(name) + '-' + Date.now()
  const { rows } = await query(`
    INSERT INTO products (name, slug, description, price, stock, category_id, seller_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [name, slug, description, price, stock, categoryId || null, sellerId])
  return rows[0]
}

const updateProduct = async (id, fields) => {
  const allowed  = ['name', 'description', 'price', 'stock', 'category_id']
  const updates  = []
  const values   = []
  let i = 1

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = $${i}`)
      values.push(fields[key])
      i++
    }
  }

  if (updates.length === 0) return null

  values.push(id)
  const { rows } = await query(`
    UPDATE products SET ${updates.join(', ')}
    WHERE id = $${i}
    RETURNING *
  `, values)
  return rows[0]
}

const softDeleteProduct = async (id) => {
  await query(
    `UPDATE products SET is_active = false WHERE id = $1`,
    [id]
  )
}

// ─── reviews ───────────────────────────────────────────────────

const getReviews = async (productId, { limit = 10, offset = 0 }) => {
  const { rows } = await query(`
    SELECT
      r.id, r.rating, r.comment, r.created_at,
      u.name AS reviewer_name
    FROM reviews r
    INNER JOIN users u ON r.user_id = u.id
    WHERE r.product_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `, [productId, limit, offset])
  return rows
}

const hasUserPurchasedProduct = async (userId, productId) => {
  const { rows } = await query(`
    SELECT 1 FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.user_id = $1
      AND oi.product_id = $2
      AND o.status = 'delivered'
    LIMIT 1
  `, [userId, productId])
  return rows.length > 0
}

const hasUserReviewedProduct = async (userId, productId) => {
  const { rows } = await query(`
    SELECT 1 FROM reviews
    WHERE user_id = $1 AND product_id = $2
    LIMIT 1
  `, [userId, productId])
  return rows.length > 0
}

const createReview = async ({ userId, productId, rating, comment }) => {
  const { rows } = await query(`
    INSERT INTO reviews (user_id, product_id, rating, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [userId, productId, rating, comment || null])
  return rows[0]
}

// ─── product images ────────────────────────────────────────────

const addProductImage = async (productId, url, sortOrder = 0) => {
  const { rows } = await query(`
    INSERT INTO product_images (product_id, url, sort_order)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [productId, url, sortOrder])
  return rows[0]
}

module.exports = {
  getProducts,
  findProductBySlug,
  findProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
  getReviews,
  hasUserPurchasedProduct,
  hasUserReviewedProduct,
  createReview,
  addProductImage,
}