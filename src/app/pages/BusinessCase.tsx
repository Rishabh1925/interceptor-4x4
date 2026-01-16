import React from 'react';
import { DollarSign, TrendingDown, Shield, Zap, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BusinessCase = () => {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Business Case & Cost Effectiveness
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Why Interceptor is the most economically viable solution for government and enterprise deepfake detection
          </p>
        </div>

        {/* Asymmetric Warfare Problem */}
        <section className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            The Asymmetric Warfare Problem
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <DollarSign className="w-12 h-12 text-red-600 dark:text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Cost Asymmetry
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                It costs a bad actor <span className="font-bold text-red-600">$0.01</span> to generate a fake riot video.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                It costs the government <span className="font-bold text-red-600">$2-5M</span> in deployed forces and damage control.
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-2 font-semibold">
                Ratio: 1:500,000,000
              </p>
            </div>

            <div className="bg-orange-50/50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
              <Zap className="w-12 h-12 text-orange-600 dark:text-orange-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Latency Trap
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Fake news spreads <span className="font-bold">6x faster</span> than truth
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Current forensic labs: <span className="font-bold">2-3 days</span> to verify
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Viral threshold: <span className="font-bold">6 hours</span>
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-2 font-semibold">
                Gap: 48-72 hours too late
              </p>
            </div>

            <div className="bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <Shield className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Privacy Deadlock
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Defense agencies cannot upload classified surveillance to Microsoft/Google Cloud
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Data sovereignty laws prohibit foreign server usage
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-2 font-semibold">
                Current solution: Manual analysis only
              </p>
            </div>
          </div>
        </section>

        {/* Competitor Comparison */}
        <section className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Competitor Analysis
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Microsoft</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Intel</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Sensity</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Interceptor</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">Core Tech</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">Cloud Ensembles</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">PPG (Blood Flow)</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">Threat Intel</td>
                  <td className="py-4 px-4 font-semibold text-blue-600 dark:text-blue-400">Agentic Edge AI</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">Deployment</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">Cloud API</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">Hardware Dependent</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">SaaS Dashboard</td>
                  <td className="py-4 px-4 font-semibold text-blue-600 dark:text-blue-400">On-Device/Edge</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">Fatal Flaw</td>
                  <td className="py-4 px-4 text-red-600 dark:text-red-400">Privacy Risk (US servers)</td>
                  <td className="py-4 px-4 text-red-600 dark:text-red-400">Fails on compressed video</td>
                  <td className="py-4 px-4 text-red-600 dark:text-red-400">Too slow for real-time</td>
                  <td className="py-4 px-4 font-semibold text-green-600 dark:text-green-400">None</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">Cost per Video</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">$2-5</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">$3-7</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">$4-8</td>
                  <td className="py-4 px-4 font-semibold text-green-600 dark:text-green-400">$0.50-1.50</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">Accuracy</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">~90%</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">~85%</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">~88%</td>
                  <td className="py-4 px-4 font-semibold text-green-600 dark:text-green-400">94.9%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Three Economic Advantages */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Three Economic Advantages
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Advantage 1 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-green-600 dark:bg-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Zero CAPEX
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Competitors require buying new servers ($50K-500K). Interceptor runs on existing smartphones and laptops.
              </p>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">$0</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Hardware Investment</p>
              </div>
            </div>

            {/* Advantage 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                74% OPEX Reduction
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Agentic routing prevents 80% of videos from touching expensive models. Massive compute savings.
              </p>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">74.2%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Compute Cost Savings</p>
              </div>
            </div>

            {/* Advantage 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-purple-600 dark:bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Predictable Billing
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Credit-based system. Pay for complexity, not duration. No surprise bills.
              </p>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">$0.50</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Average Cost per Video</p>
              </div>
            </div>
          </div>
        </section>

        {/* Credit-Based Pricing */}
        <section className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Credit-Based Pricing Model
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Unlike competitors who charge a flat fee per minute, we charge based on computational complexity.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tier 1: Public</h3>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                  FREE
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                General public, social media verification
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Baseline model only</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>1 credit per video</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$0</p>
            </div>

            <div className="border-2 border-blue-500 dark:border-blue-400 rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                POPULAR
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tier 2: Professional</h3>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  $0.50
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Police, local government, journalists
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Baseline + 2-3 specialists</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>1-3 credits per video</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$0.50</p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tier 3: Enterprise</h3>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                  $1.50
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Defense, intelligence, high-security
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>All 6 specialist models</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>6 credits per video</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$1.50</p>
            </div>
          </div>
        </section>

        {/* 5-Year TCO */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">5-Year Total Cost of Ownership</h2>
          <p className="text-blue-100 text-center mb-8 max-w-2xl mx-auto">
            For a government agency processing 100,000 videos per year
          </p>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
              <p className="text-sm text-blue-100 mb-2">Microsoft</p>
              <p className="text-3xl font-bold">$3.0M</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
              <p className="text-sm text-blue-100 mb-2">Intel</p>
              <p className="text-3xl font-bold">$3.6M</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
              <p className="text-sm text-blue-100 mb-2">Sensity</p>
              <p className="text-3xl font-bold">$4.2M</p>
            </div>
            <div className="bg-green-500 dark:bg-green-600 rounded-xl p-6 text-center">
              <p className="text-sm mb-2">Interceptor</p>
              <p className="text-3xl font-bold">$340K</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center">
            <p className="text-5xl font-bold mb-2">$2.7M</p>
            <p className="text-xl text-blue-100 mb-1">Total Savings vs. Microsoft</p>
            <p className="text-3xl font-bold text-green-400">89% Cost Reduction</p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to See It in Action?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Experience the most cost-effective deepfake detection solution. Fast, accurate, and economically viable.
          </p>
          <Link
            to="/workbench"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg"
          >
            Try Interceptor Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </div>
    </div>
  );
};

export default BusinessCase;
