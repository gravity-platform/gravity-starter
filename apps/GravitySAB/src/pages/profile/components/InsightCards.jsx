import React from "react";
import { motion } from "framer-motion";
import { Lightbulb, Hash, Calendar, TrendingUp, AlertCircle, Smile, Frown, CheckCircle } from "lucide-react";

export function InsightCards({ insights }) {
  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case "positive":
        return <Smile className="w-4 h-4 text-green-500" />;
      case "negative":
        return <Frown className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getImportanceColor = (importance) => {
    if (importance >= 0.7) return "bg-red-500";
    if (importance >= 0.4) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-gray-50 rounded-2xl inline-block mb-4">
          <Lightbulb className="w-12 h-12 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">No insights available yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map((insight, index) => (
        <motion.div
          key={insight.id || insight.memoryId || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
          style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getImportanceColor(insight.content?.importance || insight.metadata?.importance || 0.5)}`} />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {formatDate(insight.timestamp || insight.metadata?.timestamp)}
              </span>
            </div>
            {getSentimentIcon(insight.content?.sentiment || insight.metadata?.sentiment || "neutral")}
          </div>

          {/* Content */}
          <p className="text-gray-900 font-medium mb-3 line-clamp-3 text-sm leading-relaxed">
            {typeof insight.content === 'string' ? insight.content : insight.content?.summary || ''}
          </p>

          {/* Tags */}
          {(insight.content?.tags || insight.metadata?.tags) && (insight.content?.tags || insight.metadata?.tags).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {(insight.content?.tags || insight.metadata?.tags || []).slice(0, 3).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Key Facts */}
          {(insight.content?.keyFacts || insight.metadata?.keyFacts) && (insight.content?.keyFacts || insight.metadata?.keyFacts).length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Key Facts</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {(insight.content?.keyFacts || insight.metadata?.keyFacts || []).slice(0, 2).map((fact, factIndex) => (
                  <li key={factIndex} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="line-clamp-2">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {Math.round((insight.content?.importance || insight.metadata?.importance || 0.5) * 100)}% importance
              </span>
            </div>

            {(insight.workflowId || insight.metadata?.workflowId) && (
              <span className="text-xs text-gray-400">{insight.workflowId || insight.metadata?.workflowId}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
