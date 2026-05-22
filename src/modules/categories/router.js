const router     = require('express').Router()
const controller = require('./controller')
const authenticate = require('../../middleware/authenticate')
const authorize    = require('../../middleware/authorize')

router.get('/',  controller.getCategories)
router.post('/', authenticate, authorize('admin'), controller.createCategory)

module.exports = router