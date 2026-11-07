// routes/itemRoutes.js
// Item (lost/found report) routes.
// Endpoints are implemented in Phase 8.

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Item routes placeholder' });
});

module.exports = router;
