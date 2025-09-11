// Simple test script to verify serverless function
import dotenv from 'dotenv';
dotenv.config();

// Mock request and response objects for testing
class MockRequest {
  constructor(method = 'GET', url = '/') {
    this.method = method;
    this.url = url;
    this.headers = {};
    this.body = {};
  }
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.data = null;
    this.headersSent = false;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(data) {
    this.data = data;
    this.headersSent = true;
    console.log(`Response ${this.statusCode}:`, JSON.stringify(data, null, 2));
    return this;
  }

  send(data) {
    this.data = data;
    this.headersSent = true;
    console.log(`Response ${this.statusCode}:`, data);
    return this;
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }
}

// Test the serverless function
async function testServerlessFunction() {
  try {
    console.log('Testing serverless function...');
    
    // Import the handler
    const { default: handler } = await import('./api/index.js');
    
    // Test health check
    const req = new MockRequest('GET', '/health');
    const res = new MockResponse();
    
    await handler(req, res);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testServerlessFunction();
