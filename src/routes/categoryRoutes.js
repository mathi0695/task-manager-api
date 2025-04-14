const express = require('express');
const { 
  createCategory, 
  getAllCategories, 
  getCategoryById, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { categoryCreateSchema, categoryUpdateSchema } = require('../utils/validationSchemas');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', validate(categoryCreateSchema), createCategory);
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.patch('/:id', validate(categoryUpdateSchema), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
