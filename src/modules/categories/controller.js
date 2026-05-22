const { AppError } = require('../../middleware/errorHandler')
const queries      = require('./queries')
const slugify      = (str) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const getCategories = async (req, res, next) => {
  try {
    const categories = await queries.getCategoryTree()

    // nest children under parents
    const map  = {}
    const tree = []
    categories.forEach(c => { map[c.id] = { ...c, children: [] } })
    categories.forEach(c => {
      if (c.parent_id) map[c.parent_id]?.children.push(map[c.id])
      else tree.push(map[c.id])
    })

    res.json({ success: true, data: tree })
  } catch (err) { next(err) }
}

const createCategory = async (req, res, next) => {
  try {
    const { name, parent_id } = req.body
    if (!name) throw new AppError('Name is required', 400)

    const slug = slugify(name)
    const existing = await queries.findCategoryBySlug(slug)
    if (existing) throw new AppError('Category already exists', 409)

    const category = await queries.createCategory({ name, slug, parentId: parent_id })
    res.status(201).json({ success: true, data: category })
  } catch (err) { next(err) }
}

module.exports = { getCategories, createCategory }


