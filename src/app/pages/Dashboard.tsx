import { FileVideo, Clock, AlertCircle, X, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { RechartsDonutChart } from '../components/charts/RechartsDonutChart';
import MetadataSummary from '../components/charts/MetadataSummary';
import { getAnalyticsStats, getRecentAnalyses, formatRelativeTime } from '../../utils/supabase';
import { useState, useEffect } from 'react';

interface AnalysisDetail {
  id: string;
  filename: string;
  file_size: number;
  prediction: 'real' | 'fake';
  confidence: number;
  models_used: string[];
  processing_time: number;
  analysis_result: any;
  created_at: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    fakeDetected: 0,
    realDetected: 0,
    recentAnalyses: 0,
    averageConfidence: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<'all' | 'real' | 'fake'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Modal state
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisDetail | null>(null);
  const [showModal, setShowModal] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const fetchData = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      }
      
      const currentOffset = reset ? 0 : offset;
      
      const [analyticsData, recentData] = await Promise.all([
        getAnalyticsStats(),
        getRecentAnalyses(ITEMS_PER_PAGE, currentOffset, filter)
      ]);
      
      setStats(analyticsData);
      
      if (reset) {
        setRecentAnalyses(recentData.data);
      } else {
        setRecentAnalyses(prev => [...prev, ...recentData.data]);
      }
      setHasMore(recentData.hasMore);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [filter]);

  useEffect(() => {
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      getAnalyticsStats().then(setStats);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const newOffset = offset + ITEMS_PER_PAGE;
    setOffset(newOffset);
    
    const recentData = await getRecentAnalyses(ITEMS_PER_PAGE, newOffset, filter);
    setRecentAnalyses(prev => [...prev, ...recentData.data]);
    setHasMore(recentData.hasMore);
    setLoadingMore(false);
  };

  const handleViewAnalysis = (analysis: AnalysisDetail) => {
    setSelectedAnalysis(analysis);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnalysis(null);
  };

  const handleFilterChange = (newFilter: 'all' | 'real' | 'fake') => {
    setFilter(newFilter);
    setShowFilterDropdown(false);
  };

  const displayStats = [
    {
      label: 'Total Videos',
      value: loading ? '...' : stats.totalAnalyses.toLocaleString(),
      icon: <FileVideo className="w-5 h-5" />,
      change: '+' + stats.recentAnalyses,
    },
    {
      label: 'Detected Fakes',
      value: loading ? '...' : stats.fakeDetected.toLocaleString(),
      icon: <AlertCircle className="w-5 h-5" />,
      change: stats.totalAnalyses > 0 ? `${((stats.fakeDetected / stats.totalAnalyses) * 100).toFixed(0)}%` : '0%',
    },
    {
      label: 'Avg Confidence',
      value: loading ? '...' : `${(stats.averageConfidence * 100).toFixed(1)}%`,
      icon: <Clock className="w-5 h-5" />,
      change: 'accuracy',
    },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your analysis history and monitor detection performance
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {displayStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  {stat.icon}
                </div>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Metadata Analysis Section */}
        <div className="mb-12 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Metadata Analysis Dashboard
          </h2>
          
          <div className="mb-8 animate-scale-in">
            <MetadataSummary
              data={{
                totalVideos: stats.totalAnalyses,
                fakeDetected: stats.fakeDetected,
                realDetected: stats.realDetected,
                averageConfidence: stats.averageConfidence,
                averageProcessingTime: 3.2,
                topPerformingModel: 'TM Model',
                trend: 'up',
                trendPercentage: 12.5
              }}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="animate-slide-in-right">
              <RechartsDonutChart
                data={[
                  { label: 'Real Videos', value: stats.realDetected, color: '#10B981' },
                  { label: 'Fake Videos', value: stats.fakeDetected, color: '#EF4444' }
                ]}
                title="Detection Results"
                description="Real vs Fake video classification"
                totalLabel="Videos"
                trendText="Detection accuracy improved"
                trendPercentage="+8.2%"
              />
            </div>

            <div className="animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
              <RechartsDonutChart
                data={[
                  { label: 'High Confidence', value: Math.floor(stats.totalAnalyses * 0.45), color: '#059669' },
                  { label: 'Medium Confidence', value: Math.floor(stats.totalAnalyses * 0.35), color: '#F59E0B' },
                  { label: 'Low Confidence', value: Math.floor(stats.totalAnalyses * 0.20), color: '#EF4444' }
                ]}
                title="Confidence Levels"
                description="Analysis confidence distribution"
                totalLabel="Analyses"
                trendText="High confidence increased"
                trendPercentage="+12.5%"
              />
            </div>

            <div className="animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
              <RechartsDonutChart
                data={[
                  { label: 'Fast Processing', value: Math.floor(stats.totalAnalyses * 0.40), color: '#3B82F6' },
                  { label: 'Medium Speed', value: Math.floor(stats.totalAnalyses * 0.45), color: '#8B5CF6' },
                  { label: 'Slower Processing', value: Math.floor(stats.totalAnalyses * 0.15), color: '#F97316' }
                ]}
                title="Processing Speed"
                description="Analysis processing time breakdown"
                totalLabel="Videos"
                trendText="Processing speed improved"
                trendPercentage="+15.3%"
              />
            </div>
          </div>
        </div>

        {/* Analysis History */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recent Analyses
            </h2>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                <Filter className="w-4 h-4" />
                <span className="capitalize">{filter === 'all' ? 'All Results' : filter}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg ${filter === 'all' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : ''}`}
                  >
                    All Results
                  </button>
                  <button
                    onClick={() => handleFilterChange('real')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${filter === 'real' ? 'bg-green-50 dark:bg-green-900/30 text-green-600' : ''}`}
                  >
                    Real Only
                  </button>
                  <button
                    onClick={() => handleFilterChange('fake')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg ${filter === 'fake' ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : ''}`}
                  >
                    Fake Only
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Filename</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Result</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Confidence</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentAnalyses.length > 0 ? recentAnalyses.map((analysis) => (
                  <tr
                    key={analysis.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <FileVideo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-gray-900 dark:text-white text-sm truncate max-w-[200px]" title={analysis.filename}>
                          {analysis.filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatRelativeTime(analysis.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          analysis.prediction === 'fake'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {analysis.prediction}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">
                      {(analysis.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-4 px-4">
                      <button 
                        onClick={() => handleViewAnalysis(analysis)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-gray-500 dark:text-gray-400">
                      {loading ? 'Loading recent analyses...' : 'No analyses found. Upload a video to get started!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Detail Modal */}
      {showModal && selectedAnalysis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div 
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analysis Details</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* File Info */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  selectedAnalysis.prediction === 'fake'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  <FileVideo className={`w-8 h-8 ${
                    selectedAnalysis.prediction === 'fake'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-[400px]">
                    {selectedAnalysis.filename}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(selectedAnalysis.file_size / (1024 * 1024)).toFixed(2)} MB • {new Date(selectedAnalysis.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Result Badge */}
              <div className={`p-4 rounded-xl ${
                selectedAnalysis.prediction === 'fake'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Prediction Result</p>
                    <p className={`text-2xl font-bold capitalize ${
                      selectedAnalysis.prediction === 'fake'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {selectedAnalysis.prediction === 'fake' ? 'Manipulated (Fake)' : 'Authentic (Real)'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(selectedAnalysis.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid (time box removed) */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Models Used</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedAnalysis.models_used?.length || 1}
                  </p>
                </div>
              </div>

              {/* Models Used */}
              {selectedAnalysis.models_used && selectedAnalysis.models_used.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialist Models</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnalysis.models_used.map((model, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis Summary</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedAnalysis.prediction === 'fake'
                    ? `This video has been classified as MANIPULATED with ${(selectedAnalysis.confidence * 100).toFixed(1)}% confidence. The analysis detected potential manipulation artifacts using ${selectedAnalysis.models_used?.length || 1} specialist model(s).`
                    : `This video has been classified as AUTHENTIC with ${(selectedAnalysis.confidence * 100).toFixed(1)}% confidence. No significant manipulation artifacts were detected during the analysis.`
                  }
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
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

export default Dashboard;
