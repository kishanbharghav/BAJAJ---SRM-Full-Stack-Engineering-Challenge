import React, { useState } from 'react';
import { Send, AlertTriangle, AlertCircle, Network, RefreshCcw, Activity } from 'lucide-react';
import TreeView, { CycleView } from './components/TreeView';
import './index.css';

function App() {
  const [inputData, setInputData] = useState('["A->B", "A->C", "B->D"]');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse input string to array
      let dataArray;
      try {
        dataArray = JSON.parse(inputData);
        if (!Array.isArray(dataArray)) throw new Error('Not an array');
      } catch (err) {
        throw new Error('Input must be a valid JSON array of strings (e.g., ["A->B", "C->D"])');
      }

      // We handle the dev endpoint or relative deployment endpoint
      const endpoint = import.meta.env.VITE_API_URL || '/bfhl';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataArray })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>BFHL Challenge</h1>
        <p className="subtitle">Hierarchical Graph Processor API</p>
      </header>

      <main className="main-content">
        <section className="input-section glass-panel">
          <h2 className="panel-title">
            <Network size={20} /> Input Graph Edges
          </h2>
          <form onSubmit={handleSubmit} className="input-group">
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder='Enter valid JSON array here...'
            />
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCcw size={18} className="spinner" /> Processing...
                </>
              ) : (
                <>
                  <Send size={18} /> Process Graph
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="error-message" style={{ marginTop: '1rem' }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </section>

        <section className="results-section">
          {!result && !loading && !error && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Submit an array to see the processed hierarchies</p>
            </div>
          )}

          {result && (
            <div className="results-container">
              {/* User Identity Panel */}
              <div className="glass-panel">
                <h3 className="panel-title">User Information</h3>
                <div className="user-info">
                  <div className="info-badge">
                    <span>User ID:</span> {result.user_id}
                  </div>
                  <div className="info-badge">
                    <span>Email:</span> {result.email_id}
                  </div>
                  <div className="info-badge">
                    <span>Roll No:</span> {result.college_roll_number}
                  </div>
                </div>
              </div>

              {/* Summary Stats Panel */}
              <div className="glass-panel">
                <h3 className="panel-title">Summary Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{result.summary.total_trees}</div>
                    <div className="stat-label">Valid Trees</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{result.summary.total_cycles}</div>
                    <div className="stat-label">Cycles Detected</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{result.summary.largest_tree_root || '-'}</div>
                    <div className="stat-label">Largest Root</div>
                  </div>
                </div>
              </div>

              {/* Errors & Duplicates Panel */}
              {(result.invalid_entries?.length > 0 || result.duplicate_edges?.length > 0) && (
                <div className="glass-panel">
                  <h3 className="panel-title" style={{ color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <AlertTriangle size={20} /> Warnings & Errors
                  </h3>
                  
                  {result.invalid_entries?.length > 0 && (
                    <div className="list-container">
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Invalid Entries:</p>
                      {result.invalid_entries.map((entry, idx) => (
                        <div key={`inv-${idx}`} className="list-item">
                          {entry}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.duplicate_edges?.length > 0 && (
                    <div className="list-container">
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Duplicate Edges Ignored:</p>
                      {result.duplicate_edges.map((entry, idx) => (
                        <div key={`dup-${idx}`} className="list-item warning">
                          {entry}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hierarchies Panel */}
              <div className="glass-panel">
                <h3 className="panel-title">Processed Hierarchies</h3>
                {result.hierarchies?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No valid connected components found.</p>
                ) : (
                  <div className="tree-container">
                    {result.hierarchies.map((h, idx) => (
                      <div key={idx} style={{ marginBottom: '2rem' }}>
                        {h.has_cycle ? (
                          <CycleView root={h.root} />
                        ) : (
                          <TreeView tree={h.tree} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
