import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/apiService';
import { User, UsersResponse } from '../types';

// Enhanced interfaces for better type safety
interface UserFilters {
  search: string;
  role: string;
  status: string;
  discipline: string;
  isActive: string;
  emailVerified: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface BulkAction {
  type: 'status' | 'role' | 'delete';
  targetValue?: string | boolean;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  students: number;
  educators: number;
  admins: number;
  verified: number;
  unverified: number;
}

const AdminUserManagement: React.FC = () => {
  // Enhanced state management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'analytics'>('table');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  const limit = 20; // Increased for better performance

  // Enhanced filters state
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: '',
    discipline: '',
    isActive: '',
    emailVerified: '',
    dateRange: { start: '', end: '' }
  });

  // Helper functions for filter management
  const updateFilter = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
      discipline: '',
      isActive: '',
      emailVerified: '',
      dateRange: { start: '', end: '' }
    });
  };

  // Enhanced data fetching with better error handling and caching
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryFilters = {
        page: currentPage,
        limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) =>
            value !== '' && value !== null && value !== undefined
          )
        )
      };

      console.log('🔍 Fetching admin users with filters:', queryFilters);
      const response: UsersResponse = await api.getAdminUsers(queryFilters);

      if (response.users) {
        setUsers(response.users);
        if (response.pagination) {
          setTotalUsers(response.pagination.total);
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setUsers(Array.isArray(response) ? response : []);
      }
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);

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
  }, [currentPage, filters, sortConfig, limit]);

  // Fetch user statistics
  const fetchUserStats = useCallback(async () => {
    try {
      const response = await api.getAdminUserStats();
      if (response.statistics) {
        setStats(response.statistics);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, []);

  // Enhanced useEffect with multiple dependencies
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  // Helper function for nested object sorting
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Enhanced filtering and sorting with memoization
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = !filters.search ||
        user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        (user.profile?.firstName + ' ' + user.profile?.lastName).toLowerCase().includes(filters.search.toLowerCase());

      const matchesRole = !filters.role || user.primaryRole === filters.role;
      const matchesStatus = !filters.status || (user.status || 'active') === filters.status;
      const matchesDiscipline = !filters.discipline || user.discipline === filters.discipline;
      const matchesActive = !filters.isActive || user.isActive === (filters.isActive === 'true');
      const matchesVerified = !filters.emailVerified || user.emailVerified === (filters.emailVerified === 'true');

      // Date range filtering
      let matchesDateRange = true;
      if (filters.dateRange.start || filters.dateRange.end) {
        const userDate = new Date(user.createdAt);
        if (filters.dateRange.start) {
          matchesDateRange = matchesDateRange && userDate >= new Date(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          matchesDateRange = matchesDateRange && userDate <= new Date(filters.dateRange.end);
        }
      }

      return matchesSearch && matchesRole && matchesStatus && matchesDiscipline &&
             matchesActive && matchesVerified && matchesDateRange;
    });

    // Enhanced sorting
    filtered.sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [users, filters, sortConfig]);

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Enhanced user action handlers with better error handling
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

  // Bulk operations functionality
  const handleBulkAction = async (action: BulkAction) => {
    if (selectedUsers.size === 0) {
      setError('Please select users to perform bulk actions.');
      return;
    }

    setBulkAction(action);
    setShowBulkConfirm(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;

    try {
      setError(null);

      if (bulkAction.type === 'status') {
        const isActive = bulkAction.targetValue as boolean;
        // Use individual API calls for bulk status update
        await Promise.all(Array.from(selectedUsers).map(userId =>
          api.updateUserStatus(userId, { status: isActive ? 'active' : 'inactive' })
        ));
        // Update local state
        setUsers(prev => prev.map(user =>
          selectedUsers.has(user._id) ? { ...user, isActive } : user
        ));
      } else if (bulkAction.type === 'role') {
        const role = bulkAction.targetValue as string;
        // Use individual API calls for bulk role update
        await Promise.all(Array.from(selectedUsers).map(userId =>
          api.updateUserRole(userId, { role })
        ));
        // Update local state
        setUsers(prev => prev.map(user =>
          selectedUsers.has(user._id) ? { ...user, primaryRole: role as 'student' | 'educator' | 'admin' } : user
        ));
      } else if (bulkAction.type === 'delete') {
        if (window.confirm(`Are you sure you want to delete ${selectedUsers.size} users? This action cannot be undone.`)) {
          await Promise.all(Array.from(selectedUsers).map(userId => api.deleteUser(userId)));
          setUsers(prev => prev.filter(user => !selectedUsers.has(user._id)));
          setTotalUsers(prev => prev - selectedUsers.size);
        }
      }

      setSelectedUsers(new Set());
      setShowBulkConfirm(false);
      setBulkAction(null);
    } catch (error) {
      console.error('Bulk action error:', error);
      setError('Failed to execute bulk action. Please try again.');
    }
  };

  // User selection handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredAndSortedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(user => user._id)));
    }
  };

  // Export/Import functionality
  const handleExportUsers = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const response = await api.exportUsers({
        role: filters.role || undefined,
        status: filters.status || undefined
      });

      const blob = new Blob([response], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export users. Please try again.');
    }
  };

  const handleImportUsers = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const response = await api.importUsers(file);
          if (response.success) {
            // Refresh the users list
            fetchUsers();
            setError(null);
          } else {
            setError('Import failed. Please check the file format.');
          }
        } catch (error) {
          console.error('Import error:', error);
          setError('Failed to import users. Please try again.');
        }
      }
    };
    input.click();
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
      {/* Modern Header with Statistics */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">👥</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    User Management Hub
                  </h1>
                  <p className="text-blue-100 text-lg font-medium">Advanced user administration and analytics platform</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 gap-1">
                <button
                  onClick={() => handleExportUsers('csv')}
                  className="px-4 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2"
                  title="Export to CSV"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
                <button
                  onClick={() => handleExportUsers('json')}
                  className="px-4 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2"
                  title="Export to JSON"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  JSON
                </button>
                <button
                  onClick={handleImportUsers}
                  className="px-4 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2"
                  title="Import from CSV"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 13l3 3m0 0l3-3m-3 3V8m0 0L9 11m3-3l3 3" />
                  </svg>
                  Import
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Table
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'analytics'
                      ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Users</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Active</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Inactive</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.students}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Students</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.educators}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Educators</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.admins}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Admins</div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
            <select
              value={filters.role}
              onChange={(e) => updateFilter('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="educator">Educator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discipline</label>
            <select
              value={filters.discipline}
              onChange={(e) => updateFilter('discipline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Disciplines</option>
              <option value="medicine">Medicine</option>
              <option value="nursing">Nursing</option>
              <option value="laboratory">Laboratory</option>
              <option value="radiology">Radiology</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => updateFilter('isActive', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Users</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction({ type: 'status', targetValue: true })}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction({ type: 'status', targetValue: false })}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction({ type: 'role', targetValue: 'educator' })}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Make Educator
                </button>
                <button
                  onClick={() => handleBulkAction({ type: 'delete' })}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('username')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    User
                    {sortConfig.key === 'username' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('primaryRole')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Role
                    {sortConfig.key === 'primaryRole' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Status
                    {sortConfig.key === 'status' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('discipline')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Discipline
                    {sortConfig.key === 'discipline' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('totalCases')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Performance
                    {sortConfig.key === 'totalCases' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Joined
                    {sortConfig.key === 'createdAt' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {/* Error Message */}
              {error && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      {error}
                    </div>
                  </td>
                </tr>
              )}

              {filteredAndSortedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user._id)}
                      onChange={() => handleSelectUser(user._id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      {user.profile && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {user.profile.firstName} {user.profile.lastName}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.primaryRole)}`}>
                        {user.primaryRole}
                      </span>
                      {user.secondaryRoles && user.secondaryRoles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {user.secondaryRoles.map((role, index) => (
                            <span key={index} className={`inline-flex px-1 py-0.5 text-xs rounded-full ${getRoleColor(role)}`}>
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status || 'active')}`}>
                      {user.status || 'active'}
                    </span>
                    {!user.isActive && (
                      <div className="text-xs text-red-500 dark:text-red-400 mt-1">Disabled</div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white capitalize">
                      {user.discipline || 'N/A'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>{user.totalCases || 0} cases</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.averageScore || 0}% avg</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleUserAction(user._id, 'view')}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      View
                    </button>

                    {(user.status || 'active') === 'active' ? (
                      <button
                        onClick={() => handleUserAction(user._id, 'suspend')}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction(user._id, 'activate')}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                      >
                        Activate
                      </button>
                    )}

                    {user.primaryRole === 'student' && (
                      <button
                        onClick={() => handleUserAction(user._id, 'promote')}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                      >
                        Promote
                      </button>
                    )}

                    <button
                      onClick={() => handleUserAction(user._id, 'delete')}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedUsers.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No users found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span> ({totalUsers} total users)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          ? 'z-10 bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkConfirm && bulkAction && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Bulk Action
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to {bulkAction.type} {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}?
                {bulkAction.type === 'delete' && ' This action cannot be undone.'}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowBulkConfirm(false);
                    setBulkAction(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={executeBulkAction}
                  className={`px-4 py-2 text-white rounded-md ${
                    bulkAction.type === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">User Details</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedUser.username}</p>
              </div>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedUser.username}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedUser.email}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Role</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.primaryRole)}`}>
                    {selectedUser.primaryRole}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser.status || 'active')}`}>
                    {selectedUser.status || 'active'}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discipline</label>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{selectedUser.discipline || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Active</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedUser.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">Performance Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedUser.totalCases || 0}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Total Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedUser.averageScore || 0}%</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Average Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedUser.emailVerified ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Email Verified</div>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              {selectedUser.profile && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.profile.firstName} {selectedUser.profile.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedUser.profile.institution || 'N/A'}</p>
                    </div>
                    {selectedUser.profile.specialization && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedUser.profile.specialization}</p>
                      </div>
                    )}
                    {selectedUser.profile.yearOfStudy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year of Study</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedUser.profile.yearOfStudy}</p>
                      </div>
                    )}
                    {selectedUser.profile.competencyLevel && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Competency Level</label>
                        <p className="text-sm text-gray-900 dark:text-white capitalize">{selectedUser.profile.competencyLevel}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Secondary Roles */}
              {selectedUser.secondaryRoles && selectedUser.secondaryRoles.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-4">Secondary Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.secondaryRoles.map((role, index) => (
                      <span key={index} className={`px-3 py-1 text-sm rounded-full ${getRoleColor(role)}`}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-green-900 dark:text-green-100 mb-4">Privacy Settings</h4>
                <div className="space-y-3">
                  {selectedUser.privacySettings ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300">Show in Leaderboard</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedUser.privacySettings.showInLeaderboard
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                          {selectedUser.privacySettings.showInLeaderboard ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300">Show Real Name</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedUser.privacySettings.showRealName
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                          {selectedUser.privacySettings.showRealName ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300">Profile Visibility</span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                          {selectedUser.privacySettings.profileVisibility}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-green-600 dark:text-green-400">Default privacy settings applied</div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created</label>
                    <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Updated</label>
                    <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedUser.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User ID</label>
                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">{selectedUser._id}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowUserDetails(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => handleUserAction(selectedUser._id, 'delete')}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard View */}
      {viewMode === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">User Analytics Overview</h3>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-blue-100">Total Users</div>
                <div className="text-xs text-blue-200 mt-2">All registered users</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white">
                <div className="text-3xl font-bold">{stats.active}</div>
                <div className="text-green-100">Active Users</div>
                <div className="text-xs text-green-200 mt-2">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                <div className="text-3xl font-bold">{stats.students}</div>
                <div className="text-purple-100">Students</div>
                <div className="text-xs text-purple-200 mt-2">
                  {stats.total > 0 ? Math.round((stats.students / stats.total) * 100) : 0}% of total
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                <div className="text-3xl font-bold">{stats.verified}</div>
                <div className="text-orange-100">Verified</div>
                <div className="text-xs text-orange-200 mt-2">
                  {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% of total
                </div>
              </div>
            </div>

            {/* Role Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Role Distribution</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Admins</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {stats.admins} ({stats.total > 0 ? Math.round((stats.admins / stats.total) * 100) : 0}%)
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Educators</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {stats.educators} ({stats.total > 0 ? Math.round((stats.educators / stats.total) * 100) : 0}%)
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Students</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {stats.students} ({stats.total > 0 ? Math.round((stats.students / stats.total) * 100) : 0}%)
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {stats.active} ({stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%)
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Inactive</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {stats.inactive} ({stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}%)
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Verified</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {stats.verified} ({stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setViewMode('table')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View All Users
                </button>
                <button
                  onClick={() => {
                    // Export functionality would go here
                    console.log('Export users data');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Export Data
                </button>
                <button
                  onClick={() => {
                    // Import functionality would go here
                    console.log('Import users data');
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Import Users
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;

