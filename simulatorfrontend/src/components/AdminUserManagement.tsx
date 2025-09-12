import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';

interface User {
  _id: string;
  username: string;
  email: string;
  primaryRole: 'student' | 'admin' | 'educator';
  secondaryRoles?: string[];
  createdAt: string;
  isActive: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    institution?: string;
    specialization?: string;
    yearOfStudy?: number;
    competencyLevel?: string;
  };
  discipline?: string;
  lastActive?: string;
  totalCases?: number;
  averageScore?: number;
  privacySettings?: {
    showInLeaderboard: boolean;
    showRealName: boolean;
    profileVisibility: 'public' | 'educators' | 'private';
  };
  status?: 'active' | 'suspended' | 'inactive';
}

interface UsersResponse {
  users: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug authentication
      console.log('🔍 Debug: Checking authentication status');
      console.log('Is authenticated:', api.isAuthenticated());
      console.log('Token expiry (minutes):', api.getTimeUntilExpiry());
      
      const filters = {
        page: currentPage,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole && { role: filterRole }),
        ...(filterStatus && { status: filterStatus })
      };
      
      console.log('🔍 Fetching admin users with filters:', filters);
      const response: UsersResponse = await api.getAdminUsers(filters);
      console.log('✅ Admin users response:', response);
      
      if (response.users) {
        setUsers(response.users);
        if (response.pagination) {
          setTotalUsers(response.pagination.total);
          setTotalPages(response.pagination.pages);
        }
      } else {
        // Handle case where response structure is different
        setUsers(Array.isArray(response) ? response : []);
      }
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      
      // Provide more detailed error information
      let errorMessage = 'Failed to load users. Please try again.';
      
      if (error.message.includes('Session expired')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Could not connect to server. Please check your connection.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication required: Please log in as an admin user.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied: You do not have admin privileges.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error: The server encountered an issue. Please try again later.';
      }
      
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.primaryRole === filterRole;
    const matchesStatus = !filterStatus || (user.status || 'active') === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete' | 'promote' | 'view') => {
    try {
      setError(null);
      
      if (action === 'suspend') {
        await api.updateUserStatus(userId, { status: 'suspended' });
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, status: 'suspended' } : user
        ));
      } else if (action === 'activate') {
        await api.updateUserStatus(userId, { status: 'active' });
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, status: 'active' } : user
        ));
      } else if (action === 'promote') {
        await api.updateUserRole(userId, { role: 'educator' });
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, primaryRole: 'educator' } : user
        ));
      } else if (action === 'delete') {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          await api.deleteUser(userId);
          setUsers(prev => prev.filter(user => user._id !== userId));
          setTotalUsers(prev => prev - 1);
        }
      } else if (action === 'view') {
        const user = users.find(u => u._id === userId);
        if (user) {
          setSelectedUser(user);
          setShowUserDetails(true);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      setError(`Failed to ${action} user. Please try again.`);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'educator': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'student': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      default: return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'suspended': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'inactive': return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-gray-200 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts, roles, and privacy settings</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Users: {totalUsers}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="educator">Educator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRole('');
                setFilterStatus('');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Privacy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Error Message */}
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                      {error}
                    </div>
                  </td>
                </tr>
              )}
              
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      {user.profile && (
                        <div className="text-xs text-gray-400">
                          {user.profile.firstName} {user.profile.lastName}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.primaryRole)}`}>
                      {user.primaryRole}
                    </span>
                    {user.secondaryRoles && user.secondaryRoles.length > 0 && (
                      <div className="mt-1">
                        {user.secondaryRoles.map((role, index) => (
                          <span key={index} className={`inline-flex px-1 py-0.5 text-xs rounded-full mr-1 ${getRoleColor(role)}`}>
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status || 'active')}`}>
                      {user.status || 'active'}
                    </span>
                    {!user.isActive && (
                      <div className="text-xs text-red-500 mt-1">Disabled</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{user.totalCases || 0} cases</div>
                    <div className="text-xs text-gray-500">{user.averageScore || 0}% avg</div>
                    {user.discipline && (
                      <div className="text-xs text-blue-600 capitalize">{user.discipline}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs space-y-1">
                      {user.privacySettings ? (
                        <>
                          <div className={`flex items-center ${user.privacySettings.showInLeaderboard ? 'text-green-600' : 'text-red-600'}`}>
                            <span className="mr-1">{user.privacySettings.showInLeaderboard ? '✓' : '✗'}</span>
                            Leaderboard
                          </div>
                          <div className={`flex items-center ${user.privacySettings.showRealName ? 'text-green-600' : 'text-red-600'}`}>
                            <span className="mr-1">{user.privacySettings.showRealName ? '✓' : '✗'}</span>
                            Real Name
                          </div>
                          <div className="text-gray-500">
                            {user.privacySettings.profileVisibility}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400">Default settings</div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleUserAction(user._id, 'view')}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    
                    {(user.status || 'active') === 'active' ? (
                      <button
                        onClick={() => handleUserAction(user._id, 'suspend')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction(user._id, 'activate')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Activate
                      </button>
                    )}
                    
                    {user.primaryRole === 'student' && (
                      <button
                        onClick={() => handleUserAction(user._id, 'promote')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Promote
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleUserAction(user._id, 'delete')}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p>No users found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-md">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span> ({totalUsers} total users)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary">User Details</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Role</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.primaryRole}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.status || 'active'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discipline</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.discipline || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Institution</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.profile?.institution || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Cases</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.totalCases || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Average Score</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.averageScore || 0}%</p>
                </div>
              </div>
              
              {selectedUser.profile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Information</label>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span>{selectedUser.profile.firstName} {selectedUser.profile.lastName}</span>
                    </div>
                    {selectedUser.profile.specialization && (
                      <div className="flex justify-between">
                        <span>Specialization:</span>
                        <span>{selectedUser.profile.specialization}</span>
                      </div>
                    )}
                    {selectedUser.profile.yearOfStudy && (
                      <div className="flex justify-between">
                        <span>Year of Study:</span>
                        <span>{selectedUser.profile.yearOfStudy}</span>
                      </div>
                    )}
                    {selectedUser.profile.competencyLevel && (
                      <div className="flex justify-between">
                        <span>Competency Level:</span>
                        <span className="capitalize">{selectedUser.profile.competencyLevel}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedUser.secondaryRoles && selectedUser.secondaryRoles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.secondaryRoles.map((role, index) => (
                      <span key={index} className={`px-2 py-1 text-xs rounded-full ${getRoleColor(role)}`}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Settings</label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {selectedUser.privacySettings ? (
                    <>
                      <div className="flex justify-between">
                        <span>Show in Leaderboard:</span>
                        <span className={selectedUser.privacySettings.showInLeaderboard ? 'text-green-600' : 'text-red-600'}>
                          {selectedUser.privacySettings.showInLeaderboard ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Show Real Name:</span>
                        <span className={selectedUser.privacySettings.showRealName ? 'text-green-600' : 'text-red-600'}>
                          {selectedUser.privacySettings.showRealName ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profile Visibility:</span>
                        <span className="capitalize">{selectedUser.privacySettings.profileVisibility}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">Default privacy settings applied</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Information</label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Account Active:</span>
                    <span className={selectedUser.isActive ? 'text-green-600' : 'text-red-600'}>
                      {selectedUser.isActive ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(selectedUser.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User ID:</span>
                    <span className="font-mono text-xs">{selectedUser._id}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 space-x-3">
              <button
                onClick={() => setShowUserDetails(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;