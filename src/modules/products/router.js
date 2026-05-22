const router       = require('express').Router()
const controller   = require('./controller')
const validate     = require('../../middleware/validate')
const authenticate = require('../../middleware/authenticate')
const authorize    = require('../../middleware/authorize')
const {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  createReviewSchema,
} = require('./schema')

// public routes
router.get('/',          validate(productQuerySchema), controller.getProducts)
router.get('/:slug',                                   controller.getProduct)
router.get('/:id/reviews',                             controller.getReviews)

// protected routes
router.post('/',
  authenticate,
  authorize('seller', 'admin'),
  validate(createProductSchema),
  controller.createProduct
)

router.put('/:id',
  authenticate,
  authorize('seller', 'admin'),
  validate(updateProductSchema),
  controller.updateProduct
)

router.delete('/:id',
  authenticate,
  authorize('seller', 'admin'),
  controller.deleteProduct
)

router.post('/:id/reviews',
  authenticate,
  authorize('buyer'),
  validate(createReviewSchema),
  controller.createReview
)

module.exports = router