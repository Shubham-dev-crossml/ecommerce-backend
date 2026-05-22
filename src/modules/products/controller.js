const { AppError } = require('../../middleware/errorHandler')
const logger       = require('../../utils/logger')
const queries      = require('./queries')

// ─── list products ─────────────────────────────────────────────

const getProducts = async (req, res, next) => {
  try {
    const {
      search, category_id, min_price, max_price,
      in_stock, sort, cursor_date, cursor_id, limit
    } = req.validated.query

    const products = await queries.getProducts({
      search,
      categoryId: category_id,
      minPrice:   min_price,
      maxPrice:   max_price,
      inStock:    in_stock,
      sort,
      cursorDate: cursor_date,
      cursorId:   cursor_id,
      limit,
    })

    // return last item's cursor for next page
    const lastItem = products[products.length - 1]
    const nextCursor = lastItem
      ? { cursor_date: lastItem.created_at, cursor_id: lastItem.id }
      : null

    res.json({
      success: true,
      data: products,
      pagination: {
        count:      products.length,
        nextCursor,
        hasMore:    products.length === (Number(limit) || 20),
      }
    })
  } catch (err) { next(err) }
}

// ─── single product ────────────────────────────────────────────

const getProduct = async (req, res, next) => {
  try {
    const product = await queries.findProductBySlug(req.params.slug)
    if (!product) throw new AppError('Product not found', 404)
    res.json({ success: true, data: product })
  } catch (err) { next(err) }
}

// ─── create product ────────────────────────────────────────────

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category_id } = req.validated.body

    const product = await queries.createProduct({
      name,
      description,
      price,
      stock,
      categoryId: category_id,
      sellerId:   req.user.id,
    })

    logger.info(`Product created: ${product.id} by seller ${req.user.id}`)
    res.status(201).json({ success: true, data: product })
  } catch (err) { next(err) }
}

// ─── update product ────────────────────────────────────────────

const updateProduct = async (req, res, next) => {
  try {
    const product = await queries.findProductById(req.params.id)
    if (!product) throw new AppError('Product not found', 404)

    // only the seller or admin can update
    if (product.seller_id !== req.user.id && req.user.role !== 'admin')
      throw new AppError('You do not have permission to update this product', 403)

    const updated = await queries.updateProduct(req.params.id, req.validated.body)
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
}

// ─── delete product ────────────────────────────────────────────

const deleteProduct = async (req, res, next) => {
  try {
    const product = await queries.findProductById(req.params.id)
    if (!product) throw new AppError('Product not found', 404)

    if (product.seller_id !== req.user.id && req.user.role !== 'admin')
      throw new AppError('You do not have permission to delete this product', 403)

    await queries.softDeleteProduct(req.params.id)
    res.json({ success: true, message: 'Product deleted successfully' })
  } catch (err) { next(err) }
}

// ─── reviews ───────────────────────────────────────────────────

const getReviews = async (req, res, next) => {
  try {
    const product = await queries.findProductById(req.params.id)
    if (!product) throw new AppError('Product not found', 404)

    const limit  = Math.min(Number(req.query.limit) || 10, 50)
    const offset = Number(req.query.offset) || 0

    const reviews = await queries.getReviews(req.params.id, { limit, offset })
    res.json({ success: true, data: reviews, pagination: { limit, offset } })
  } catch (err) { next(err) }
}

const createReview = async (req, res, next) => {
  try {
    const { id: productId } = req.params
    const { rating, comment } = req.validated.body

    const product = await queries.findProductById(productId)
    if (!product) throw new AppError('Product not found', 404)

    // only buyers who received the product can review
    const hasPurchased = await queries.hasUserPurchasedProduct(req.user.id, productId)
    if (!hasPurchased)
      throw new AppError('You can only review products you have purchased and received', 403)

    const hasReviewed = await queries.hasUserReviewedProduct(req.user.id, productId)
    if (hasReviewed)
      throw new AppError('You have already reviewed this product', 409)

    const review = await queries.createReview({
      userId: req.user.id, productId, rating, comment
    })

    res.status(201).json({ success: true, data: review })
  } catch (err) { next(err) }
}

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getReviews,
  createReview,
}