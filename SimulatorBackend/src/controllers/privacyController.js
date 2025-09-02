import PrivacyService from '../services/privacyService.js';

// Get user's privacy settings
export const getPrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const privacySettings = await PrivacyService.getPrivacySettings(userId);
    
    res.status(200).json({
      success: true,
      data: privacySettings
    });
  } catch (error) {
    console.error('Error in getPrivacySettings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get privacy settings'
    });
  }
};

// Update user's privacy settings
export const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;
    
    // Validate settings
    const allowedFields = [
      'showInLeaderboard',
      'showRealName', 
      'shareProgressWithEducators',
      'allowAnonymousAnalytics',
      'dataRetentionPeriod',
      'profileVisibility'
    ];
    
    const filteredSettings = {};
    for (const field of allowedFields) {
      if (settings.hasOwnProperty(field)) {
        filteredSettings[field] = settings[field];
      }
    }
    
    const updatedSettings = await PrivacyService.updatePrivacySettings(userId, filteredSettings);
    
    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    console.error('Error in updatePrivacySettings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update privacy settings'
    });
  }
};

// Export user data
export const exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { exportType = 'all', format = 'json' } = req.query;
    
    const exportData = await PrivacyService.exportUserData(userId, exportType);
    
    // Set appropriate headers for download
    const filename = `simuatech-data-export-${exportType}-${Date.now()}`;
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.status(200).json(exportData);
    } else if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csvData = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.status(200).send(csvData);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format. Use json or csv.'
      });
    }
  } catch (error) {
    console.error('Error in exportUserData:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export user data'
    });
  }
};

// Request account deletion
export const requestAccountDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real implementation, this might create a deletion request
    // that requires admin approval or has a waiting period
    const result = await PrivacyService.deleteUserData(userId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Account deletion request processed. Your data has been removed.'
    });
  } catch (error) {
    console.error('Error in requestAccountDeletion:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process account deletion'
    });
  }
};

// Get privacy statistics (admin only)
export const getPrivacyStatistics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const stats = await PrivacyService.getPrivacyStatistics();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getPrivacyStatistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get privacy statistics'
    });
  }
};

// Helper function to convert data to CSV
function convertToCSV(data) {
  const flattenObject = (obj, prefix = '') => {
    let flattened = {};
    for (let key in obj) {
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], prefix + key + '.'));
      } else {
        flattened[prefix + key] = obj[key];
      }
    }
    return flattened;
  };
  
  const flattened = flattenObject(data);
  const headers = Object.keys(flattened).join(',');
  const values = Object.values(flattened).map(v => 
    typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
  ).join(',');
  
  return `${headers}\n${values}`;
}