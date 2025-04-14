const express = require('express');
const { 
  createTask, 
  getAllTasks, 
  getTaskById, 
  updateTask, 
  deleteTask 
} = require('../controllers/taskController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { taskCreateSchema, taskUpdateSchema, taskQuerySchema } = require('../utils/validationSchemas');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', validate(taskCreateSchema), createTask);
router.get('/', validate(taskQuerySchema, 'query'), getAllTasks);
router.get('/:id', getTaskById);
router.patch('/:id', validate(taskUpdateSchema), updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
