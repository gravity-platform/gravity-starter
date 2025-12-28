import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, User, Tag, MapPin, Building, Calendar, Hash } from "lucide-react";

export function ProfileDataView({ profileData }) {
  console.log('[ProfileDataView] Received profileData:', profileData);
  console.log('[ProfileDataView] profileData type:', typeof profileData);
  console.log('[ProfileDataView] profileData keys:', profileData ? Object.keys(profileData) : 'null/undefined');
  
  // Check if profileData exists
  if (!profileData) {
    console.log('[ProfileDataView] No profileData provided');
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg">No profile data available yet</p>
        <p className="text-sm mt-2">Profile information will be captured from forms and conversations</p>
      </div>
    );
  }
  
  // Extract data based on new standardized structure
  const profileInfo = profileData?.profile || {};
  const serviceInterests = profileData?.serviceInterests || {};
  const businessProfile = profileData?.businessProfile || {};
  const patterns = profileData?.patterns || {};
  
  console.log('[ProfileDataView] Extracted profileInfo:', profileInfo);
  console.log('[ProfileDataView] Extracted serviceInterests:', serviceInterests);
  console.log('[ProfileDataView] Extracted businessProfile:', businessProfile);
  
  // Extract personal info from profile
  const { name, email, phone, firstName } = profileInfo;
  const attributes = profileInfo?.attributes || {};
  const tags = profileInfo?.tags || [];
  const entities = profileInfo?.entities || {};
  const inferred = profileInfo?.inferred || {};
  
  // Extract patterns
  const commonQuestions = patterns.commonQuestions || [];

  return (
    <div className="space-y-6">
      {/* Core Identifiers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {name && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{name}</p>
              </div>
            </div>
          )}
          {firstName && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">First Name</p>
                <p className="font-medium text-gray-900">{firstName}</p>
              </div>
            </div>
          )}
          {email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{phone}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Dynamic Attributes */}
      {Object.keys(attributes).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Attributes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(attributes).map(([key, value]) => (
              <div key={key} className="bg-gray-50/50 rounded-lg p-3">
                <p className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="font-medium text-gray-900">{String(value)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Profile Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full text-sm font-medium text-gray-700 border border-gray-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Business Profile */}
      {Object.keys(businessProfile).some(key => businessProfile[key]) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businessProfile.entityType && (
              <div className="bg-gray-50/50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Entity Type</p>
                <p className="font-medium text-gray-900">{businessProfile.entityType}</p>
              </div>
            )}
            {businessProfile.businessStage && (
              <div className="bg-gray-50/50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Business Stage</p>
                <p className="font-medium text-gray-900">{businessProfile.businessStage}</p>
              </div>
            )}
            {businessProfile.industry && (
              <div className="bg-gray-50/50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Industry</p>
                <p className="font-medium text-gray-900">{businessProfile.industry}</p>
              </div>
            )}
            {businessProfile.fundingStatus && (
              <div className="bg-gray-50/50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Funding Status</p>
                <p className="font-medium text-gray-900">{businessProfile.fundingStatus}</p>
              </div>
            )}
            {businessProfile.employeeCount > 0 && (
              <div className="bg-gray-50/50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Employee Count</p>
                <p className="font-medium text-gray-900">{businessProfile.employeeCount}</p>
              </div>
            )}
            {businessProfile.targetMarket && (
              <div className="bg-gray-50/50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Target Market</p>
                <p className="font-medium text-gray-900">{businessProfile.targetMarket}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}



      {/* Patterns */}
      {patterns.commonQuestions?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Questions</h3>
          <div className="space-y-2">
            {patterns.commonQuestions.map((question, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-sm text-gray-400 font-medium mt-0.5">{index + 1}.</span>
                <p className="text-gray-700">{question}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Extracted Entities */}
      {Object.keys(entities).some(key => entities[key]?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Entities</h3>
          <div className="space-y-4">
            {entities.locations?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">Locations</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.locations.map((loc, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {entities.organizations?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">Organizations</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.organizations.map((org, i) => (
                    <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">
                      {org}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {entities.dates?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">Dates</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.dates.map((date, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm">
                      {date}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {entities.amounts?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">Amounts</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.amounts.map((amount, i) => (
                    <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-sm">
                      {amount}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Inferred Characteristics */}
      {Object.keys(inferred).some(key => inferred[key]) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inferred Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inferred.stage && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Business Stage</p>
                <p className="font-semibold text-gray-900">{inferred.stage}</p>
              </div>
            )}
            {inferred.segment && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">User Segment</p>
                <p className="font-semibold text-gray-900">{inferred.segment}</p>
              </div>
            )}
            {inferred.intent?.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 md:col-span-2">
                <p className="text-sm text-gray-600 mb-2">Intentions & Goals</p>
                <div className="flex flex-wrap gap-2">
                  {inferred.intent.map((intent, i) => (
                    <span key={i} className="px-2 py-1 bg-white/80 rounded text-sm font-medium text-gray-700">
                      {intent}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {inferred.priorities?.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 md:col-span-2">
                <p className="text-sm text-gray-600 mb-2">Priorities</p>
                <div className="flex flex-wrap gap-2">
                  {inferred.priorities.map((priority, i) => (
                    <span key={i} className="px-2 py-1 bg-white/80 rounded text-sm font-medium text-gray-700">
                      {priority}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!name && !email && !phone && 
       Object.keys(attributes).length === 0 && tags.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No profile data available yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Profile information will be captured from forms and conversations
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default ProfileDataView;
