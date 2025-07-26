// Standardized API response format used by all services
class ApiResponse {
    static success(data, message = 'Success', statusCode = 200) {
      return {
        success: true,
        statusCode,
        message,
        data,
        timestamp: new Date().toISOString()
      };
    }
  
    static error(message, statusCode = 500, errors = null) {
      return {
        success: false,
        statusCode,
        message,
        errors,
        timestamp: new Date().toISOString()
      };
    }
  
    static paginated(data, pagination, message = 'Success') {
      return {
        success: true,
        statusCode: 200,
        message,
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          pages: pagination.pages,
          hasNext: pagination.page < pagination.pages,
          hasPrev: pagination.page > 1
        },
        timestamp: new Date().toISOString()
      };
    }
  }
  
  module.exports = ApiResponse;