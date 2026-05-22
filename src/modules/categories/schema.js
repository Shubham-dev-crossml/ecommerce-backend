const { z } = require('zod')

const createProductSchema = z.object({
  body: z.object({
    name:        z.string().min(3).max(255),
    description: z.string().min(10).optional(),
    price:       z.number().positive(),
    stock:       z.number().int().min(0),
    category_id: z.string().uuid().optional(),
  })
})

const updateProductSchema = z.object({
  body: z.object({
    name:        z.string().min(3).max(255).optional(),
    description: z.string().min(10).optional(),
    price:       z.number().positive().optional(),
    stock:       z.number().int().min(0).optional(),
    category_id: z.string().uuid().optional(),
  }),
  params: z.object({
    id: z.string().uuid()
  })
})

const productQuerySchema = z.object({
  query: z.object({
    search:      z.string().optional(),
    category_id: z.string().uuid().optional(),
    min_price:   z.string().optional(),
    max_price:   z.string().optional(),
    in_stock:    z.string().optional(),
    sort:        z.enum(['newest', 'price_asc', 'price_desc', 'rating']).optional(),
    cursor_date: z.string().optional(),
    cursor_id:   z.string().uuid().optional(),
    limit:       z.string().optional(),
  })
})

const createReviewSchema = z.object({
  body: z.object({
    rating:  z.number().int().min(1).max(5),
    comment: z.string().min(3).max(1000).optional(),
  }),
  params: z.object({
    id: z.string().uuid()
  })
})

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  createReviewSchema,
}