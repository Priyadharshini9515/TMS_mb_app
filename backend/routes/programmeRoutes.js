const express = require('express');
const programmeController = require('../controllers/programmeController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  programmeController.createProgramme
);

router.get('/', programmeController.getProgrammes);

router.get(
  '/:id',
  authMiddleware,
  programmeController.getProgrammeById
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  programmeController.updateProgramme
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  programmeController.deleteProgramme
);

module.exports = router;
