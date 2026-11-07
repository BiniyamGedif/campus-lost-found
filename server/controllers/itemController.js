// controllers/itemController.js
// CRUD operations for Lost and Found reports (items).

const Item = require('../models/Item');

const createItem = async (req, res, next) => {
  try {
    const { name, description, category, location, dateOfIncident, reportType, contactEmail, contactPhone, imageUrl, imagePublicId } = req.body;
    const item = await Item.create({ name, description, category, location, dateOfIncident, reportType, contactEmail: contactEmail || '', contactPhone: contactPhone || '', imageUrl: imageUrl || '', imagePublicId: imagePublicId || '', user: req.user._id });
    res.status(201).json({ success: true, item });
  } catch (error) { next(error); }
};

const getItems = async (req, res, next) => {
  try {
    const items = await Item.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: items.length, items });
  } catch (error) { next(error); }
};

const getItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('user', 'name email');
    if (!item) { res.status(404); throw new Error('Report not found'); }
    res.status(200).json({ success: true, item });
  } catch (error) { next(error); }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) { res.status(404); throw new Error('Report not found'); }
    if (item.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') { res.status(403); throw new Error('Not authorized to update this report'); }
    const allowedFields = ['name','description','category','location','dateOfIncident','reportType','contactEmail','contactPhone','imageUrl','imagePublicId'];
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) item[field] = req.body[field]; });
    const updated = await item.save();
    res.status(200).json({ success: true, item: updated });
  } catch (error) { next(error); }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) { res.status(404); throw new Error('Report not found'); }
    if (item.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') { res.status(403); throw new Error('Not authorized to delete this report'); }
    await item.deleteOne();
    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) { next(error); }
};

const recoverItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) { res.status(404); throw new Error('Report not found'); }
    if (item.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') { res.status(403); throw new Error('Not authorized to recover this report'); }
    item.status = 'recovered';
    await item.save();
    res.status(200).json({ success: true, item });
  } catch (error) { next(error); }
};

module.exports = { createItem, getItems, getItem, updateItem, deleteItem, recoverItem };
