// controllers/itemController.js
// CRUD operations for Lost and Found reports (items).

const Item = require('../models/Item');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');
const { uploadImage, deleteImage } = require('../utils/uploadImage');

// @desc    Create a new report (lost or found) with optional image
// @route   POST /api/items
// @access  Private
const createItem = async (req, res, next) => {
  try {
    const { name, description, category, location, dateOfIncident, reportType, contactEmail, contactPhone } = req.body;

    let imageUrl = '';
    let imagePublicId = '';

    if (req.file) {
      const { url, publicId } = await uploadImage(req.file.buffer);
      imageUrl = url;
      imagePublicId = publicId;
    }

    const item = await Item.create({
      name,
      description,
      category,
      location,
      dateOfIncident,
      reportType,
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      imageUrl,
      imagePublicId,
      user: req.user._id,
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports (search, filter, sort, paginate)
// @route   GET /api/items
// @access  Public
const getItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, sort = 'newest', category, reportType, status, location, q } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const filters = {};

    if (category) filters.category = category.trim();
    if (reportType) filters.reportType = reportType.trim();
    if (status) filters.status = status.trim();
    if (location) filters.location = new RegExp(location.trim(), 'i');
    if (q) {
      filters.$or = [
        { name: new RegExp(q.trim(), 'i') },
        { description: new RegExp(q.trim(), 'i') },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
    };

    const query = Item.find(filters)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limitNum);

    const [items, total] = await Promise.all([query, Item.countDocuments(filters)]);

    res.status(200).json({
      success: true,
      count: items.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single report
// @route   GET /api/items/:id
// @access  Public
const getItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('user', 'name email');
    if (!item) {
      res.status(404);
      throw new Error('Report not found');
    }
    res.status(200).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// @desc    Update own report (supports image replacement)
// @route   PUT /api/items/:id
// @access  Private (owner or admin)
const updateItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Report not found');
    }

    if (item.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this report');
    }

    const allowedFields = ['name', 'description', 'category', 'location', 'dateOfIncident', 'reportType', 'contactEmail', 'contactPhone'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    if (req.file) {
      if (item.imagePublicId) {
        await deleteImage(item.imagePublicId);
      }
      const { url, publicId } = await uploadImage(req.file.buffer);
      item.imageUrl = url;
      item.imagePublicId = publicId;
    }

    const updated = await item.save();
    res.status(200).json({ success: true, item: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a report (permanent)
// @route   DELETE /api/items/:id
// @access  Private (owner or admin)
const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Report not found');
    }

    if (item.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this report');
    }

    if (item.imagePublicId) {
      await deleteImage(item.imagePublicId);
    }

    await item.deleteOne();
    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a report as recovered
// @route   PATCH /api/items/:id/recover
// @access  Private (owner or admin)
const recoverItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Report not found');
    }

    if (item.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to recover this report');
    }

    item.status = 'recovered';
    await item.save();
    res.status(200).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

module.exports = { createItem, getItems, getItem, updateItem, deleteItem, recoverItem };
