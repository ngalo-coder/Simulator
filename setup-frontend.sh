EOF

# CaseCard Component
cat > src/components/CaseCard.tsx << 'EOF'
import React from 'react';
import { Clock, Play, Heart, Brain, Eye, Bone, Stethoscope } from 'lucide-react';
import { PatientCase } from '../types';

interface CaseCardProps {
  case: PatientCase;
  onStart?: (caseId: string) => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ case: caseData, onStart }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty.toLowerCase()) {
      case 'cardiology': return <Heart className="h-5 w-5" />;
      case 'neurology': return <Brain className="h-5 w-5" />;
      case 'ophthalmology': return <Eye className="h-5 w-5" />;
      case 'orthopedics': return <Bone className="h-5 w-5" />;
      default: return <Stethoscope className="h-5 w-5" />;
    }
  };

  const handleStart = () => {
    if (onStart) {
      onStart(caseData.id);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="text-blue-600">
            {getSpecialtyIcon(caseData.specialized_area)}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(caseData.difficulty)}`}>
            {caseData.difficulty}
          </span>
        </div>
        <div className="flex items-center text-gray-500 text-sm">
          <Clock className="h-4 w-4 mr-1" />
          {caseData.estimated_time}
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{caseData.title}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{caseData.description}</p>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {caseData.patient_gender}, {caseData.patient_age}y
        </div>
        <button 
          onClick={handleStart}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
        >
          <Play className="h-4 w-4 mr-1" />
          Start
        </button>
      </div>
    </div>
  );
};

export default CaseCard;
EOF

# Create pages directory and components
echo "📄 Creating page components..."

# Dashboard Page
cat > src/pages/Dashboard.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { BookOpen, Star, Heart, Award, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import { PatientCase, PerformanceData } from '../types';
import CaseCard from '../components/CaseCard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentCases, setRecentCases] = useState<PatientCase[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [casesResponse, performanceResponse] = await Promise.all([
          apiClient.getCases({ limit: 6 }),
          user ? apiClient.getPerformanceSummary(user.id) : Promise.resolve(null)
        ]);
        
        setRecentCases(casesResponse.cases || []);
        setPerformanceData(performanceResponse);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  const handleStartCase = async (caseId: string) => {
    try {
      const response = await apiClient.startSimulation(caseId);
      console.log('Started simulation:', response);
      // Handle simulation start - could navigate to simulation page
    } catch (error) {
      console.error('Error starting simulation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.username}!</h1>
        <p className="opacity-90">Ready to continue your clinical training journey?</p>
      </div>

      {/* Stats Overview */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-gray-900">{performanceData.overallStats?.totalEvaluations || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Excellent Rate</p>
                <p className="text-2xl font-bold text-green-600">{performanceData.overallStats?.excellentRate || '0%'}</p>
              </div>
              <Star className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Specialties</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(performanceData.specialtyStats || {}).length}</p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contributor Status</p>
                <p className="text-2xl font-bold text-purple-600">{performanceData.contributorStatus?.isEligible ? 'Eligible' : 'Training'}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Cases */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Available Cases</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCases.map((caseData) => (
              <CaseCard key={caseData.id} case={caseData} onStart={handleStartCase} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
EOF

# Cases Page
cat > src/pages/Cases.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { apiClient } from '../services/api';
import { PatientCase } from '../types';
import CaseCard from '../components/CaseCard';

const Cases: React.FC = () => {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    program_area: '',
    specialty: '',
    difficulty: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCases();
  }, [filters]);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getCases(filters);
      setCases(response.cases || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
    setIsLoading(false);
  };

  const handleStartCase = async (caseId: string) => {
    try {
      const response = await apiClient.startSimulation(caseId);
      console.log('Started simulation:', response);
    } catch (error) {
      console.error('Error starting simulation:', error);
    }
  };

  const filteredCases = cases.filter(caseData =>
    caseData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseData.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Cases</h1>
          <p className="text-gray-600">Practice with virtual patients across various specialties</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filters.program_area}
              onChange={(e) => setFilters({...filters, program_area: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Programs</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
              <option value="continuing_education">Continuing Education</option>
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((caseData) => (
            <CaseCard key={caseData.id} case={caseData} onStart={handleStartCase} />
          ))}
        </div>
      )}

      {!isLoading && filteredCases.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default Cases;
EOF

# Performance Page
cat > src/pages/Performance.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, UserCheck, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import { PerformanceData } from '../types';

const Performance: React.FC = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!user) return;
      
      try {
        const data = await apiClient.getPerformanceSummary(user.id);
        setPerformanceData(data);
      } catch (error) {
        console.error('Error fetching performance data:', error);
      }
      setIsLoading(false);
    };

    fetchPerformanceData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-gray-600">Track your progress and identify areas for improvement</p>
      </div>

      {/* Performance Overview */}
      {performanceData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Overall Performance</h3>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Cases:</span>
                  <span className="font-medium">{performanceData.overallStats?.totalEvaluations || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Excellent Rate:</span>
                  <span className="font-medium text-green-600">{performanceData.overallStats?.excellentRate || '0%'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Ratings Breakdown</h3>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Excellent:</span>
                  <span className="font-medium text-green-600">{performanceData.overallStats?.excellentCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Good:</span>
                  <span className="font-medium text-yellow-600">{performanceData.overallStats?.goodCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Needs Improvement:</span>
                  <span className="font-medium text-red-600">{performanceData.overallStats?.needsImprovementCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Contributor Status</h3>
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`font-medium ${performanceData.contributorStatus?.isEligible ? 'text-green-600' : 'text-gray-600'}`}>
                    {performanceData.contributorStatus?.isEligible ? 'Eligible' : 'In Training'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Eligible Specialties:</span>
                  <span className="font-medium">{performanceData.contributorStatus?.eligibleSpecialties?.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Contributions</h3>
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Submitted:</span>
                  <span className="font-medium">{performanceData.contributionStats?.totalSubmissions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Approved:</span>
                  <span className="font-medium text-green-600">{performanceData.contributionStats?.approvedSubmissions || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Evaluations */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Evaluations</h2>
            </div>
            <div className="p-6">
              {performanceData.recentEvaluations?.length > 0 ? (
                <div className="space-y-4">
                  {performanceData.recentEvaluations.map((evaluation: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{evaluation.caseTitle}</h3>
                        <p className="text-sm text-gray-600">{evaluation.specialty}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          evaluation.rating === 'Excellent' ? 'bg-green-100 text-green-800' :
                          evaluation.rating === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {evaluation.rating}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Score: {evaluation.score}/100</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent evaluations found</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Performance;
EOF

# Admin Page
cat > src/pages/Admin.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Users, BookOpen, MessageSquare, TrendingUp, User } from 'lucide-react';
import { apiClient } from '../services/api';

const Admin: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsResponse, usersResponse] = await Promise.all([
          apiClient.getSystemStats(),
          apiClient.getUsers()
        ]);
        
        setStats(statsResponse);
        setUsers(usersResponse.users || []);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
      setIsLoading(false);
    };

    fetchAdminData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* System Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCases || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Users */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Users</h2>
        </div>
        <div className="p-6">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map((user, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          {user.username}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
EOF

# Simulation Page
cat > src/pages/Simulation.tsx << 'EOF'
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Stethoscope } from 'lucide-react';
import { apiClient } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  speaks_for?: string;
}

const Simulation: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentCase, setCurrentCase] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewSimulation = async (caseId: string) => {
    try {
      const response = await apiClient.startSimulation(caseId);
      setSessionId(response.sessionId);
      setCurrentCase({ id: caseId, patientName: response.patientName });
      
      // Add initial message
      const initialMessage: Message = {
        role: 'assistant',
        content: response.initialPrompt || 'Hello, I\'m your virtual patient. How can I help you today?',
        timestamp: new Date(),
        speaks_for: response.patientName || 'Patient'
      };
      
      setMessages([initialMessage]);
    } catch (error) {
      console.error('Error starting simulation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    let assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      speaks_for: currentCase?.patientName || 'Patient'
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const cleanup = apiClient.streamSimulationAsk(
        sessionId,
        inputMessage,
        (chunk, speaks_for) => {
          assistantMessage.content += chunk;
          if (speaks_for) assistantMessage.speaks_for = speaks_for;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...assistantMessage };
            return newMessages;
          });
        },
        () => {
          setIsLoading(false);
        },
        (error) => {
          console.error('Streaming error:', error);
          setIsLoading(false);
        },
        (summary) => {
          console.log('Session ended with summary:', summary);
          setIsLoading(false);
        }
      );

      // Store cleanup function if needed
      return cleanup;
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!sessionId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Virtual Patient Simulation</h1>
          <p className="text-gray-600">Start a simulation session with a virtual patient</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Simulation</h3>
            <p className="text-gray-600 mb-6">Select a case from the Cases page to start a simulation session</p>
            <button
              onClick={() => startNewSimulation('demo-case-1')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Start Demo Simulation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Simulation Session</h1>
            <p className="text-sm text-gray-600">
              Patient: {currentCase?.patientName || 'Virtual Patient'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Active</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3/4 p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.role === 'assistant' && message.speaks_for && (
                <div className="text-xs opacity-75 mb-1">
                  {message.speaks_for}
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-gray-600">Patient is responding...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or question..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
EOF

# Create main App component
echo "🚀 Creating main App component..."
cat > src/App.tsx << 'EOF'
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginForm from './components/LoginForm';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import Performance from './pages/Performance';
import Admin from './pages/Admin';
import Simulation from './pages/Simulation';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'cases':
        return <Cases />;
      case 'performance':
        return <Performance />;
      case 'admin':
        return user.role === 'admin' ? <Admin /> : <Dashboard />;
      case 'simulation':
        return <Simulation />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-8">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
EOF

# Create environment configuration
echo "🔧 Creating environment configuration..."
cat > .env << 'EOF'
VITE_API_URL=https://simulatorbackend.onrender.com
VITE_NODE_ENV=development
EOF

cat > .env.example << 'EOF'
VITE_API_URL=https://simulatorbackend.onrender.com
VITE_NODE_ENV=development
EOF

# Create README
echo "📚 Creating README..."
cat > README.md << 'EOF'
# Virtual Patient Simulation Frontend

A modern React frontend for the Virtual Patient Simulation system, built with TypeScript, Tailwind CSS, and Vite.

## Features

- 🔐 **Authentication System** - Login/Register with JWT tokens
- 🏥 **Patient Cases** - Browse and filter medical simulation cases
- 💬 **Real-time Simulation** - Interactive chat with AI patients
- 📊 **Performance Analytics** - Track progress and scores
- 👨‍💼 **Admin Dashboard** - System management for administrators
- 📱 **Responsive Design** - Works on all device sizes
- ⚡ **Fast Development** - Hot reload with Vite

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and setup the project:**
   ```bash
   git clone <your-repo-url>
   cd virtual-patient-frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── LoginForm.tsx
│   ├── Navigation.tsx
│   └── CaseCard.tsx
├── pages/              # Main page components
│   ├── Dashboard.tsx
│   ├── Cases.tsx
│   ├── Performance.tsx
│   ├── Admin.tsx
│   └── Simulation.tsx
├── hooks/              # Custom React hooks
│   └── useAuth.tsx
├── services/           # API services
│   └── api.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
├── App.tsx             # Main app component
└── main.tsx           # Entry point
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

### Environment Variables

- `VITE_API_URL` - Backend API URL
- `VITE_NODE_ENV` - Environment (development/production)

### Backend Integration

The frontend is configured to work with the Virtual Patient Simulation backend at:
`https://simulatorbackend.onrender.com`

To use with a different backend:
1. Update `VITE_API_URL` in `.env`
2. Ensure CORS is configured on your backend
3. Set `USE_MOCK_DATA = false` in `src/services/api.ts`

## Development

### Mock Data Mode

For development without a backend, set `USE_MOCK_DATA = true` in `src/services/api.ts`.

### Adding New Features

1. **New Pages:** Add to `src/pages/` and update routing in `App.tsx`
2. **New Components:** Add to `src/components/`
3. **API Calls:** Add to `src/services/api.ts`
4. **Types:** Define in `src/types/index.ts`

## Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `build/` directory.

### Deploy Options

- **Netlify:** Drag and drop the `build/` folder
- **Vercel:** Connect your Git repository
- **AWS S3:** Upload the `build/` folder contents
- **GitHub Pages:** Use the build output

### Environment Setup for Production

Make sure to set the correct `VITE_API_URL` for your production backend.

## API Integration

The frontend integrates with the following backend endpoints:

- **Authentication:** `/api/auth/login`, `/api/auth/register`
- **Cases:** `/api/simulation/cases`, `/api/simulation/start`
- **Performance:** `/api/performance/summary/:userId`
- **Admin:** `/api/admin/stats`, `/api/admin/users`
- **Streaming:** `/api/simulation/ask` (Server-Sent Events)

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure your backend allows requests from your frontend domain
   - Check that the API URL is correct

2. **Authentication Issues:**
   - Clear localStorage: `localStorage.clear()`
   - Check that JWT tokens are being sent in headers

3. **Build Errors:**
   - Run `npm install` to ensure all dependencies are installed
   - Check TypeScript errors with `npm run lint`

### Support

For issues and questions:
1. Check the console for error messages
2. Verify API endpoints are responding
3. Test with mock data mode first

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
/build
/dist

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/
EOF

# Final setup steps
echo "🔧 Final setup steps..."

# Create package-lock.json if it doesn't exist and install dependencies
npm install

echo ""
echo "✅ Setup Complete!"
echo "==================="
echo ""
echo "🎉 Your Virtual Patient Simulation frontend is ready!"
echo ""
echo "📁 Project created in: $(pwd)"
echo ""
echo "🚀 To start development:"
echo "   cd $PROJECT_NAME"
echo "   npm run dev"
echo ""
echo "🌐 Then open: http://localhost:3000"
echo ""
echo "📚 Features included:"
echo "   ✓ Authentication system"
echo "   ✓ Patient case browser"
echo "   ✓ Real-time simulation chat"
echo "   ✓ Performance analytics"
echo "   ✓ Admin dashboard"
echo "   ✓ Responsive design"
echo "   ✓ TypeScript support"
echo ""
echo "🔧 Configuration:"
echo "   • Backend URL: https://simulatorbackend.onrender.com"
echo "   • Mock data mode available for development"
echo "   • Full API integration ready"
echo ""
echo "📖 Check README.md for detailed documentation"
echo ""
echo "Happy coding! 🏥💻"#!/bin/bash

# Virtual Patient Simulation Frontend Setup Script
# This script creates a complete React frontend for the Virtual Patient Simulation system

set -e  # Exit on any error

echo "🏥 Setting up Virtual Patient Simulation Frontend..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Project name
PROJECT_NAME="virtual-patient-frontend"

# Create project directory
echo "📁 Creating project directory: $PROJECT_NAME"
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Initialize package.json
echo "📦 Initializing package.json..."
cat > package.json << 'EOF'
{
  "name": "virtual-patient-simulation-frontend",
  "version": "1.0.0",
  "private": true,
  "description": "Frontend for Virtual Patient Simulation System",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}
EOF

# Install dependencies
echo "⚡ Installing dependencies..."
npm install

# Create Vite config
echo "⚙️ Creating Vite configuration..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'build',
    sourcemap: true
  }
})
EOF

# Create TypeScript config
echo "📝 Creating TypeScript configuration..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Create TypeScript Node config
cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# Create Tailwind config
echo "🎨 Creating Tailwind CSS configuration..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
EOF

# Create PostCSS config
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create ESLint config
echo "🔍 Creating ESLint configuration..."
cat > .eslintrc.cjs << 'EOF'
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
EOF

# Create directory structure
echo "📂 Creating directory structure..."
mkdir -p src/{components,pages,hooks,services,types,utils}
mkdir -p public

# Create index.html
echo "🌐 Creating index.html..."
cat > index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/stethoscope.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Virtual Patient Simulation</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Create favicon (simple SVG stethoscope)
cat > public/stethoscope.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
  <circle cx="20" cy="10" r="2"/>
</svg>
EOF

# Create main.tsx
echo "⚛️ Creating React entry point..."
cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Create index.css
echo "🎨 Creating global styles..."
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer utilities {
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}
EOF

# Create types
echo "📋 Creating TypeScript types..."
cat > src/types/index.ts << 'EOF'
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface PatientCase {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_time: string;
  program_area: string;
  specialized_area: string;
  patient_age: number;
  patient_gender: string;
  chief_complaint: string;
  presenting_symptoms: string[];
  tags: string[];
}

export interface SimulationSession {
  sessionId: string;
  caseId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    speaks_for?: string;
  }>;
  isActive: boolean;
}

export interface PerformanceData {
  overallStats: {
    totalEvaluations: number;
    excellentCount: number;
    goodCount: number;
    needsImprovementCount: number;
    excellentRate: string;
  };
  specialtyStats: Record<string, {
    totalCases: number;
    excellentCount: number;
    averageScore: number;
  }>;
  contributorStatus: {
    isEligible: boolean;
    eligibleSpecialties: string[];
    qualificationDate?: Date;
  };
  contributionStats: {
    totalSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    pendingSubmissions: number;
  };
  recentEvaluations: Array<{
    caseTitle: string;
    specialty: string;
    rating: string;
    score: number;
    completedAt: Date;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}
EOF

# Create API service
echo "🔌 Creating API service..."
cat > src/services/api.ts << 'EOF'
import { User, PatientCase, PerformanceData } from '../types';

const API_BASE_URL = 'https://simulatorbackend.onrender.com';
const USE_MOCK_DATA = false; // Set to true for development without backend

// Auth utilities
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch (e) {
    return null;
  }
};

const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  headers.append('Content-Type', 'application/json');

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.reload();
  }
  
  return response;
};

// Mock data for development
const mockData = {
  users: [
    { id: '1', username: 'demo_user', email: 'demo@example.com', role: 'user' as const },
    { id: '2', username: 'admin', email: 'admin@example.com', role: 'admin' as const }
  ],
  cases: [
    {
      id: '1',
      title: 'Acute Myocardial Infarction',
      description: 'A 65-year-old male presents with chest pain and shortness of breath',
      category: 'Emergency',
      difficulty: 'Hard',
      estimated_time: '45 min',
      program_area: 'undergraduate',
      specialized_area: 'Cardiology',
      patient_age: 65,
      patient_gender: 'Male',
      chief_complaint: 'Chest pain',
      presenting_symptoms: ['Chest pain', 'Shortness of breath', 'Sweating'],
      tags: ['cardiology', 'emergency', 'MI']
    },
    {
      id: '2',
      title: 'Type 2 Diabetes Management',
      description: 'A 45-year-old female with newly diagnosed Type 2 diabetes',
      category: 'Chronic Care',
      difficulty: 'Medium',
      estimated_time: '30 min',
      program_area: 'undergraduate',
      specialized_area: 'Endocrinology',
      patient_age: 45,
      patient_gender: 'Female',
      chief_complaint: 'High blood sugar',
      presenting_symptoms: ['Polyuria', 'Polydipsia', 'Fatigue'],
      tags: ['diabetes', 'endocrinology', 'management']
    },
    // Add more mock cases as needed
  ] as PatientCase[],
  performanceData: {
    overallStats: {
      totalEvaluations: 12,
      excellentCount: 8,
      goodCount: 3,
      needsImprovementCount: 1,
      excellentRate: '67%'
    },
    specialtyStats: {
      'Cardiology': { totalCases: 3, excellentCount: 2, averageScore: 85 },
      'Endocrinology': { totalCases: 2, excellentCount: 2, averageScore: 92 },
    },
    contributorStatus: {
      isEligible: true,
      eligibleSpecialties: ['Cardiology', 'Endocrinology'],
      qualificationDate: new Date('2024-01-15')
    },
    contributionStats: {
      totalSubmissions: 3,
      approvedSubmissions: 2,
      rejectedSubmissions: 0,
      pendingSubmissions: 1
    },
    recentEvaluations: [
      { caseTitle: 'Type 2 Diabetes Management', specialty: 'Endocrinology', rating: 'Excellent', score: 94, completedAt: new Date('2024-01-20') },
    ]
  } as PerformanceData,
};

export const apiClient = {
  // Auth APIs
  login: async (email: string, password: string) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const user = email === 'admin@example.com' ? mockData.users[1] : mockData.users[0];
      const mockResponse = {
        token: 'mock-jwt-token-' + Date.now(),
        user
      };
      localStorage.setItem('authToken', mockResponse.token);
      localStorage.setItem('currentUser', JSON.stringify(mockResponse.user));
      return mockResponse;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    return data;
  },

  register: async (username: string, email: string, password: string) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { message: 'Registration successful' };
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }
    
    return response.json();
  },

  // Simulation APIs
  getCases: async (filters?: any) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        cases: mockData.cases,
        currentPage: 1,
        totalPages: 1,
        totalCases: mockData.cases.length
      };
    }
    
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/simulation/cases?${queryParams.toString()}`
    );
    return response.json();
  },

  startSimulation: async (caseId: string) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        sessionId: 'mock-session-' + Date.now(),
        initialPrompt: 'Hello, I\'m your virtual patient. How can I help you today?',
        patientName: 'John Doe'
      };
    }
    
    const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/start`, {
      method: 'POST',
      body: JSON.stringify({ caseId })
    });
    return response.json();
  },

  // Stream simulation responses
  streamSimulationAsk: (
    sessionId: string,
    question: string,
    onChunk: (chunk: string, speaks_for?: string) => void,
    onDone: () => void,
    onError?: (error: any) => void,
    onSessionEnd?: (summary: string) => void
  ) => {
    if (USE_MOCK_DATA) {
      // Mock streaming response
      const mockResponse = "This is a mock response from the virtual patient. In a real scenario, this would be streamed from the AI.";
      let index = 0;
      const interval = setInterval(() => {
        if (index < mockResponse.length) {
          onChunk(mockResponse.slice(index, index + 5));
          index += 5;
        } else {
          clearInterval(interval);
          onDone();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    const token = getAuthToken();
    const queryParams = new URLSearchParams({ sessionId, question, token: token || '' });
    const eventSource = new EventSource(`${API_BASE_URL}/api/simulation/ask?${queryParams.toString()}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'chunk':
            onChunk(data.content, data.speaks_for);
            break;
          case 'done':
            eventSource.close();
            onDone();
            break;
          case 'session_end':
            if (onSessionEnd) onSessionEnd(data.summary);
            eventSource.close();
            break;
        }
      } catch (err) {
        if (onError) onError(err);
        eventSource.close();
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(err);
      eventSource.close();
    };

    return () => eventSource.close();
  },

  // Performance APIs
  getPerformanceSummary: async (userId: string) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return {
        userId,
        name: 'Demo User',
        email: 'demo@example.com',
        ...mockData.performanceData
      };
    }
    
    const response = await authenticatedFetch(`${API_BASE_URL}/api/performance/summary/${userId}`);
    return response.json();
  },

  // Admin APIs
  getSystemStats: async () => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 700));
      return {
        totalUsers: 1247,
        totalCases: 156,
        totalSessions: 3429,
        activeUsers: 89
      };
    }
    
    const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/stats`);
    return response.json();
  },

  getUsers: async () => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { users: mockData.users };
    }
    
    const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users`);
    return response.json();
  }
};
EOF

# Create Auth Context
echo "🔐 Creating Auth Context..."
cat > src/hooks/useAuth.tsx << 'EOF'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: true
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Error parsing stored user', e);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiClient.login(email, password);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
EOF

# Create components directory and basic components
echo "🧩 Creating React components..."

# Login Form Component
cat > src/components/LoginForm.tsx << 'EOF'
import React, { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const username = email.split('@')[0];
        await apiClient.register(username, email, password);
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Virtual Patient Simulation</h1>
          <p className="text-gray-600 mt-2">Practice clinical skills with AI patients</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
EOF

# Navigation Component
cat > src/components/Navigation.tsx << 'EOF'
import React from 'react';
import { BarChart3, BookOpen, TrendingUp, Settings, Stethoscope, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'cases', label: 'Cases', icon: BookOpen },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
    { id: 'simulation', label: 'Simulation', icon: Stethoscope }
  ];

  return (
    <div className="bg-white border-r border-gray-200 w-64 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-blue-600 rounded-lg p-2 mr-3">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">VirtPatient</h1>
            <p className="text-xs text-gray-600">Simulation Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-600">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
          )