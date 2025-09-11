// Test script to check admin API authentication and response
import { api } from './src/services/apiService.js';

async function testAdminAPI() {
    console.log('🔍 Testing Admin API...');
    
    // Check if user is authenticated
    console.log('Is authenticated:', api.isAuthenticated());
    console.log('Token expiry time (minutes):', api.getTimeUntilExpiry());
    
    try {
        // Test system stats first (simpler endpoint)
        console.log('\n📊 Testing System Stats...');
        const stats = await api.getSystemStats();
        console.log('✅ System stats:', stats);
        
        // Test admin users
        console.log('\n👥 Testing Admin Users...');
        const users = await api.getAdminUsers({ page: 1, limit: 5 });
        console.log('✅ Admin users:', users);
        
    } catch (error) {
        console.error('❌ API Error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        // Check local storage for auth data
        console.log('\n🔍 Auth Debug Info:');
        console.log('Auth token exists:', !!localStorage.getItem('authToken'));
        console.log('Current user exists:', !!localStorage.getItem('currentUser'));
        
        const token = localStorage.getItem('authToken');
        if (token) {
            console.log('Token preview:', token.substring(0, 50) + '...');
            
            try {
                // Decode JWT to check expiry
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('Token payload:', {
                    exp: payload.exp,
                    iat: payload.iat,
                    userId: payload.userId,
                    role: payload.role
                });
                console.log('Token expires at:', new Date(payload.exp * 1000));
                console.log('Token is expired:', Date.now() >= (payload.exp * 1000));
            } catch (e) {
                console.log('Could not decode token:', e.message);
            }
        }
    }
}

// Export for use in browser console
window.testAdminAPI = testAdminAPI;

console.log('🚀 Admin API test loaded. Run testAdminAPI() in console to test.');