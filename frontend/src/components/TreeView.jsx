import React from 'react';
import { ChevronRight, CircleOff } from 'lucide-react';

const TreeView = ({ tree, isRoot = true }) => {
  if (!tree || Object.keys(tree).length === 0) return null;

  return (
    <div className={isRoot ? 'tree-root' : ''}>
      {Object.entries(tree).map(([node, children]) => (
        <div key={node} className="tree-node-wrapper">
          <div className="tree-node-content">
            <ChevronRight size={16} className="node-icon" />
            <span>{node}</span>
          </div>
          {Object.keys(children).length > 0 && (
            <TreeView tree={children} isRoot={false} />
          )}
        </div>
      ))}
    </div>
  );
};

export const CycleView = ({ root }) => {
  return (
    <div className="tree-root">
      <div className="tree-node-wrapper">
        <div className="tree-node-content">
          <CircleOff size={16} className="node-icon" style={{ color: '#fca5a5' }} />
          <span>{root} (Cyclic)</span>
        </div>
        <div className="cycle-indicator">
          <span>Cycle detected in component</span>
        </div>
      </div>
    </div>
  );
};

export default TreeView;
