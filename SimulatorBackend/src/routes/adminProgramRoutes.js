import express from 'express';
import {
  getProgramAreas,
  addProgramArea,
  updateProgramArea,
  deleteProgramArea,
  getSpecialties,
  addSpecialty,
  updateSpecialty,
  deleteSpecialty,
  getProgramAreasWithCounts,
  getSpecialtiesWithCounts
} from '../controllers/adminProgramController.js';
import { protect, isAdmin } from '../middleware/jwtAuthMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Programs
 *   description: Program and specialty management for administrators
 */

// Program Area routes
/**
 * @swagger
 * /admin/programs/program-areas:
 *   get:
 *     summary: Get all program areas
 *     description: Retrieves a list of all program areas available in the system
 *     tags: [Admin Programs]
 *     responses:
 *       200:
 *         description: List of program areas retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProgramArea'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/program-areas', getProgramAreas);

/**
 * @swagger
 * /admin/programs/program-areas/counts:
 *   get:
 *     summary: Get program areas with case counts
 *     description: Retrieves program areas along with the count of cases in each area
 *     tags: [Admin Programs]
 *     responses:
 *       200:
 *         description: Program areas with counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   caseCount:
 *                     type: integer
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/program-areas/counts', getProgramAreasWithCounts);

/**
 * @swagger
 * /admin/programs/program-areas:
 *   post:
 *     summary: Create a new program area
 *     description: Creates a new program area (admin only)
 *     tags: [Admin Programs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the program area
 *               description:
 *                 type: string
 *                 description: Optional description of the program area
 *     responses:
 *       201:
 *         description: Program area created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProgramArea'
 *       400:
 *         description: Bad request - missing or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin access required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/program-areas', protect, isAdmin, addProgramArea);

/**
 * @swagger
 * /admin/programs/program-areas/{id}:
 *   put:
 *     summary: Update a program area
 *     description: Updates an existing program area (admin only)
 *     tags: [Admin Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the program area to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the program area
 *               description:
 *                 type: string
 *                 description: Updated description of the program area
 *     responses:
 *       200:
 *         description: Program area updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProgramArea'
 *       400:
 *         description: Bad request - missing or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Program area not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/program-areas/:id', protect, isAdmin, updateProgramArea);

/**
 * @swagger
 * /admin/programs/program-areas/{id}:
 *   delete:
 *     summary: Delete a program area
 *     description: Deletes a program area (admin only)
 *     tags: [Admin Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the program area to delete
 *     responses:
 *       200:
 *         description: Program area deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Program area not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/program-areas/:id', protect, isAdmin, deleteProgramArea);

// Specialty routes
/**
 * @swagger
 * /admin/programs/specialties:
 *   get:
 *     summary: Get all specialties
 *     description: Retrieves a list of all specialties available in the system
 *     tags: [Admin Programs]
 *     responses:
 *       200:
 *         description: List of specialties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Specialty'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/specialties', getSpecialties);

/**
 * @swagger
 * /admin/programs/specialties/counts:
 *   get:
 *     summary: Get specialties with case counts
 *     description: Retrieves specialties along with the count of cases in each specialty
 *     tags: [Admin Programs]
 *     responses:
 *       200:
 *         description: Specialties with counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   caseCount:
 *                     type: integer
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/specialties/counts', getSpecialtiesWithCounts);

/**
 * @swagger
 * /admin/programs/specialties:
 *   post:
 *     summary: Create a new specialty
 *     description: Creates a new specialty (admin only)
 *     tags: [Admin Programs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the specialty
 *               description:
 *                 type: string
 *                 description: Optional description of the specialty
 *               programArea:
 *                 type: string
 *                 description: ID of the parent program area
 *     responses:
 *       201:
 *         description: Specialty created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Specialty'
 *       400:
 *         description: Bad request - missing or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin access required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/specialties', protect, isAdmin, addSpecialty);

/**
 * @swagger
 * /admin/programs/specialties/{id}:
 *   put:
 *     summary: Update a specialty
 *     description: Updates an existing specialty (admin only)
 *     tags: [Admin Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the specialty to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the specialty
 *               description:
 *                 type: string
 *                 description: Updated description of the specialty
 *               programArea:
 *                 type: string
 *                 description: Updated ID of the parent program area
 *     responses:
 *       200:
 *         description: Specialty updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Specialty'
 *       400:
 *         description: Bad request - missing or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Specialty not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/specialties/:id', protect, isAdmin, updateSpecialty);

/**
 * @swagger
 * /admin/programs/specialties/{id}:
 *   delete:
 *     summary: Delete a specialty
 *     description: Deletes a specialty (admin only)
 *     tags: [Admin Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the specialty to delete
 *     responses:
 *       200:
 *         description: Specialty deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Specialty not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/specialties/:id', protect, isAdmin, deleteSpecialty);

export default router;