const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
router.route('/line')
  .get(authController.line)

module.exports = router