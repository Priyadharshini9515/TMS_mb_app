const express = require('express');
const roleController = require('../controllers/roleController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  roleController.createRole
);

router.get('/', roleController.getRoles);

router.get(
  '/:id',
  authMiddleware,
  roleController.getRoleById
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  roleController.updateRole
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  roleController.deleteRole
);

module.exports = router;
