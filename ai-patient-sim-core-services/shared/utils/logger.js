// Centralized logging for all services
class Logger {
    static info(service, message, data = {}) {
      console.log(JSON.stringify({
        level: 'info',
        service,
        message,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  
    static error(service, message, error = {}) {
      console.error(JSON.stringify({
        level: 'error',
        service,
        message,
        error: {
          message: error.message,
          stack: error.stack
        },
        timestamp: new Date().toISOString()
      }));
    }
  
    static warn(service, message, data = {}) {
      console.warn(JSON.stringify({
        level: 'warn',
        service,
        message,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  
    static debug(service, message, data = {}) {
      if (process.env.NODE_ENV === 'development') {
        console.log(JSON.stringify({
          level: 'debug',
          service,
          message,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }
  
  module.exports = Logger;