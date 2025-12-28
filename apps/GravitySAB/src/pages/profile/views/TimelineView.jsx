import React from 'react';
import { ConversationTimeline } from '../components/ConversationTimeline';

export default function TimelineView({ memories }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
      <ConversationTimeline memories={memories} />
    </div>
  );
}
