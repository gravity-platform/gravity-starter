import React from 'react';
import { MemoryNetwork } from '../components/MemoryNetwork';

export default function NetworkView({ memories }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
      <MemoryNetwork memories={memories} />
    </div>
  );
}
