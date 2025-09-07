import express from 'express';
import ContributedCase from '../models/ContributedCaseModel.js';
import Case from '../models/CaseModel.js';
import { checkContributorEligibility } from '../middleware/performanceMiddleware.js';
import { protect as requireAuth, optionalAuth as extractUserInfo } from '../middleware/jwtAuthMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /contribute/form-data:
 *   get:
 *     summary: Get case contribution form data
 *     description: Retrieves available options for case contribution including specialties, modules, program areas, difficulties, locations, genders, and emotional tones
 *     tags: [Case Contribution]
 *     responses:
 *       200:
 *         description: Form data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 specialties:
 *                   type: array
 *                   items:
 *                     type: string
 *                 modules:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: string
 *                 programAreas:
 *                   type: array
 *                   items:
 *                     type: string
 *                 difficulties:
 *                   type: array
 *                   items:
 *                     type: string
 *                 locations:
 *                   type: array
 *                   items:
 *                     type: string
 *                 genders:
 *                   type: array
 *                   items:
 *                     type: string
 *                 emotionalTones:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/form-data', async (req, res) => {
  try {
    // Get available specialties and modules from existing cases
    const specialties = await Case.distinct('case_metadata.specialty');
    const modules = await Case.distinct('case_metadata.module');
    
    // Module mapping for Internal Medicine
    const internalMedicineModules = [
      'Cardiovascular System',
      'Tropical Medicine', 
      'Central Nervous System',
      'Respiratory System',
      'Genital Urinary System',
      'Musculoskeletal System',
      'Endocrinology',
      'Emergency Medicine'
    ];
    
    const formData = {
      specialties: specialties.filter(s => s), // Remove null values
      modules: {
        'Internal Medicine': internalMedicineModules,
        'Pediatrics': [],
        'General Surgery': [],
        'Reproductive Health': []
      },
      programAreas: ['Basic Program', 'Specialty Program'],
      difficulties: ['Easy', 'Intermediate', 'Hard'],
      locations: ['East Africa', 'West Africa', 'Central Africa', 'Southern Africa', 'Global'],
      genders: ['Male', 'Female', 'Other'],
      emotionalTones: [
        'Anxious and worried',
        'Calm but concerned', 
        'Frustrated and impatient',
        'Scared and vulnerable',
        'Hopeful but uncertain',
        'Tired and exhausted',
        'Confused and overwhelmed'
      ]
    };
    
    res.json(formData);
  } catch (error) {
    console.error('Error fetching form data:', error);
    res.status(500).json({ error: 'Failed to fetch form data' });
  }
});

/**
 * @swagger
 * /contribute/draft:
 *   post:
 *     summary: Save case as draft
 *     description: Saves a case contribution as a draft for later submission. Requires authentication and contributor eligibility.
 *     tags: [Case Contribution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseData
 *             properties:
 *               caseData:
 *                 $ref: '#/components/schemas/ContributedCaseInput'
 *     responses:
 *       201:
 *         description: Case draft saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 caseId:
 *                   type: string
 *                   format: objectid
 *                   description: ID of the saved draft case
 *                 generatedCaseId:
 *                   type: string
 *                   description: Generated case ID for reference
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Contributor not eligible or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/draft', extractUserInfo, requireAuth, checkContributorEligibility, async (req, res) => {
  try {
    const { caseData } = req.body;
    const { id: contributorId, name: contributorName, email: contributorEmail } = req.user;
    
    const contributedCase = new ContributedCase({
      contributorId,
      contributorName,
      contributorEmail,
      caseData,
      status: 'draft'
    });
    
    await contributedCase.save();
    
    res.status(201).json({
      message: 'Case draft saved successfully',
      caseId: contributedCase._id,
      generatedCaseId: contributedCase.caseData.case_metadata.case_id
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

/**
 * @swagger
 * /contribute/submit:
 *   post:
 *     summary: Submit case for review
 *     description: Submits a case contribution for formal review. Validates required fields and requires authentication and contributor eligibility.
 *     tags: [Case Contribution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseData
 *             properties:
 *               caseData:
 *                 $ref: '#/components/schemas/ContributedCaseInput'
 *     responses:
 *       201:
 *         description: Case submitted successfully for review
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 caseId:
 *                   type: string
 *                   format: objectid
 *                   description: ID of the submitted case
 *                 generatedCaseId:
 *                   type: string
 *                   description: Generated case ID for reference
 *       400:
 *         description: Missing required fields or invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 missingFields:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Contributor not eligible or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/submit', extractUserInfo, requireAuth, checkContributorEligibility, async (req, res) => {
  try {
    const { caseData } = req.body;
    const { id: contributorId, name: contributorName, email: contributorEmail } = req.user;
    
    // Validate required fields
    const requiredFields = [
      'case_metadata.title',
      'case_metadata.specialty', 
      'case_metadata.program_area',
      // 'case_metadata.difficulty', // Removed from user interface
      'case_metadata.location',
      'patient_persona.name',
      'patient_persona.age',
      'patient_persona.gender',
      'patient_persona.chief_complaint',
      'patient_persona.emotional_tone',
      'clinical_dossier.hidden_diagnosis',
      'initial_prompt'
    ];
    
    const missingFields = [];
    requiredFields.forEach(field => {
      const fieldPath = field.split('.');
      let value = caseData;
      for (const path of fieldPath) {
        value = value?.[path];
      }
      if (!value) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }
    
    const contributedCase = new ContributedCase({
      contributorId,
      contributorName,
      contributorEmail,
      caseData,
      status: 'submitted',
      submittedAt: new Date()
    });
    
    await contributedCase.save();
    
    res.status(201).json({
      message: 'Case submitted successfully for review',
      caseId: contributedCase._id,
      generatedCaseId: contributedCase.caseData.case_metadata.case_id
    });
  } catch (error) {
    console.error('Error submitting case:', error);
    res.status(500).json({ error: 'Failed to submit case' });
  }
});

/**
 * @swagger
 * /contribute/my-cases:
 *   get:
 *     summary: Get contributor's cases
 *     description: Retrieves all cases contributed by the authenticated user
 *     tags: [Case Contribution]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contributor's cases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     format: objectid
 *                   status:
 *                     type: string
 *                     enum: [draft, submitted, under_review, approved, rejected, needs_revision]
 *                   caseData:
 *                     type: object
 *                     properties:
 *                       case_metadata:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           specialty:
 *                             type: string
 *                           case_id:
 *                             type: string
 *                   submittedAt:
 *                     type: string
 *                     format: date-time
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   reviewComments:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/my-cases', extractUserInfo, requireAuth, async (req, res) => {
  try {
    const contributorId = req.user.id;
    
    const cases = await ContributedCase.find({ contributorId })
      .sort({ updatedAt: -1 })
      .select('_id status caseData.case_metadata.title caseData.case_metadata.specialty caseData.case_metadata.case_id submittedAt createdAt reviewComments');
    
    res.json(cases);
  } catch (error) {
    console.error('Error fetching contributor cases:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

/**
 * @swagger
 * /contribute/edit/{caseId}:
 *   get:
 *     summary: Get case for editing
 *     description: Retrieves a contributed case for editing. Only draft or needs_revision cases can be edited.
 *     tags: [Case Contribution]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the case to edit
 *     responses:
 *       200:
 *         description: Case retrieved successfully for editing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContributedCase'
 *       403:
 *         description: Case cannot be edited in current status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/edit/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const contributedCase = await ContributedCase.findById(caseId);
    
    if (!contributedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Only allow editing of draft or needs_revision cases
    if (!['draft', 'needs_revision'].includes(contributedCase.status)) {
      return res.status(403).json({ error: 'Case cannot be edited in current status' });
    }
    
    res.json(contributedCase);
  } catch (error) {
    console.error('Error fetching case for editing:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

/**
 * @swagger
 * /contribute/update/{caseId}:
 *   put:
 *     summary: Update case
 *     description: Updates a contributed case. Only draft or needs_revision cases can be updated.
 *     tags: [Case Contribution]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the case to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseData
 *             properties:
 *               caseData:
 *                 $ref: '#/components/schemas/ContributedCaseInput'
 *     responses:
 *       200:
 *         description: Case updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 caseId:
 *                   type: string
 *                   format: objectid
 *       403:
 *         description: Case cannot be updated in current status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/update/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { caseData } = req.body;
    
    const contributedCase = await ContributedCase.findById(caseId);
    
    if (!contributedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Only allow updating of draft or needs_revision cases
    if (!['draft', 'needs_revision'].includes(contributedCase.status)) {
      return res.status(403).json({ error: 'Case cannot be updated in current status' });
    }
    
    contributedCase.caseData = caseData;
    contributedCase.updatedAt = new Date();
    
    await contributedCase.save();
    
    res.json({
      message: 'Case updated successfully',
      caseId: contributedCase._id
    });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

/**
 * @swagger
 * /contribute/delete/{caseId}:
 *   delete:
 *     summary: Delete draft case
 *     description: Deletes a draft case. Only draft cases can be deleted.
 *     tags: [Case Contribution]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the draft case to delete
 *     responses:
 *       200:
 *         description: Case deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Only draft cases can be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/delete/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const contributedCase = await ContributedCase.findById(caseId);
    
    if (!contributedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Only allow deleting draft cases
    if (contributedCase.status !== 'draft') {
      return res.status(403).json({ error: 'Only draft cases can be deleted' });
    }
    
    await ContributedCase.findByIdAndDelete(caseId);
    
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

export default router;