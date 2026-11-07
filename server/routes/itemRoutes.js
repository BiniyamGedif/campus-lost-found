// routes/itemRoutes.js
// Item (lost/found report) routes.

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { createItem, getItems, getItem, updateItem, deleteItem, recoverItem } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');
const { validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array()[0].msg));
  }
  next();
};

const createValidation = [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('dateOfIncident').notEmpty().withMessage('Incident date is required').isISO8601().withMessage('Invalid date'),
  body('reportType').isIn(['lost', 'found']).withMessage('Report type must be lost or found'),
];

router.get('/', getItems);
router.get('/:id', getItem);
router.post('/', protect, createValidation, handleValidation, createItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);
router.patch('/:id/recover', protect, recoverItem);

module.exports = router;
