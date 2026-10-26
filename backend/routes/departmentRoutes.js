const express = require('express');
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  departmentController.createDepartment
);

router.get('/', departmentController.getDepartments);

router.get(
  '/:id',
  authMiddleware,
  departmentController.getDepartmentById
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  departmentController.updateDepartment
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  departmentController.deleteDepartment
);

module.exports = router;
