import React from 'react';

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Platform Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-2">Projects</h2>
          <p className="text-zinc-400">Manage your AI-powered applications.</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-2">AI Agents</h2>
          <p className="text-zinc-400">Configure and monitor your AI bots.</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-2">Tools</h2>
          <p className="text-zinc-400">Access integrated tools like Camera.</p>
        </div>
      </div>
    </div>
  );
};
