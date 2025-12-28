import React from 'react';
import { InterestBubbles } from '../components/InterestBubbles';
import { Target, AlertCircle, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InterestsView({ profileData }) {
  // Extract insights data
  const insights = profileData?.insights || {};
  const needs = insights?.needs || {};
  
  // Debug logging
  console.log('[InterestsView] profileData:', profileData);
  console.log('[InterestsView] insights:', insights);
  console.log('[InterestsView] needsTags:', insights?.needsTags);
  
  // Process service interests with scores
  const serviceInterests = [];
  if (profileData?.rawData?.serviceInterests) {
    Object.entries(profileData.rawData.serviceInterests).forEach(([key, value]) => {
      if (value > 0) {
        const serviceName = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
        serviceInterests.push({
          name: serviceName,
          weight: value / 10,
          score: value
        });
      }
    });
  }
  
  serviceInterests.sort((a, b) => b.score - a.score);
  

  
  // Take top 8 service interests by score
  const topServiceInterests = serviceInterests.slice(0, 8);
  
  // Show elegant empty state if no data
  if (topServiceInterests.length === 0 && !insights?.needsTags?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-5xl font-thin text-black mb-6">
            No insights yet
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Your journey begins with the first conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Needs Tags Word Cloud */}
      {insights?.needsTags?.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100"
          style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}
        >
          <h2 className="text-3xl font-light text-gray-900 mb-8">
            Key Needs
          </h2>
          <InterestBubbles 
            data={insights.needsTags.map((tag, index) => ({
              name: tag,
              weight: 0.8 - (index * 0.1),
              type: 'need'
            }))}
          />
        </motion.div>
      )}



      {/* Needs */}
      {(needs?.immediate?.length > 0 || needs?.upcoming?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100"
          style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}
        >
          <h2 className="text-3xl font-light text-gray-900 mb-8">
            Identified Needs
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {needs?.immediate?.length > 0 && (
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Immediate
                </h3>
                <div className="space-y-3">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <p className="text-gray-700">{needs.immediate}</p>
                  </motion.div>
                </div>
              </div>
            )}
            
            {needs?.upcoming && (
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Upcoming
                </h3>
                <div className="space-y-3">
                  {needs.upcoming && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <p className="text-gray-700">{needs.upcoming}</p>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
