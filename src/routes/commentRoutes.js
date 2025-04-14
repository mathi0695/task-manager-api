const express = require('express');
const { 
  createComment, 
  getComments, 
  updateComment, 
  deleteComment 
} = require('../controllers/commentController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { commentCreateSchema, commentUpdateSchema } = require('../utils/validationSchemas');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', validate(commentCreateSchema), createComment);
router.get('/', getComments);
router.patch('/:id', validate(commentUpdateSchema), updateComment);
router.delete('/:id', deleteComment);

module.exports = router;
