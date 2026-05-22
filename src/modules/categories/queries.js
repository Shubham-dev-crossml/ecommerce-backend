const { query } = require('../../config/db')

// get full nested category tree using recursive CTE
const getCategoryTree = async () => {
  const { rows } = await query(`
    WITH RECURSIVE category_tree AS (
      -- base: top-level categories
      SELECT id, name, slug, parent_id, 0 AS depth
      FROM categories
      WHERE parent_id IS NULL

      UNION ALL

      -- recursive: children
      SELECT c.id, c.name, c.slug, c.parent_id, ct.depth + 1
      FROM categories c
      INNER JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT * FROM category_tree ORDER BY depth, name
  `)
  return rows
}

const findCategoryBySlug = async (slug) => {
  const { rows } = await query(
    `SELECT * FROM categories WHERE slug = $1`,
    [slug]
  )
  return rows[0] || null
}

const findCategoryById = async (id) => {
  const { rows } = await query(
    `SELECT * FROM categories WHERE id = $1`,
    [id]
  )
  return rows[0] || null
}

const createCategory = async ({ name, slug, parentId }) => {
  const { rows } = await query(
    `INSERT INTO categories (name, slug, parent_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, slug, parentId || null]
  )
  return rows[0]
}

module.exports = {
  getCategoryTree,
  findCategoryBySlug,
  findCategoryById,
  createCategory,
}