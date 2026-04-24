const USER_ID = 'KishanBharghavV_22042006';
const EMAIL_ID = 'kv4704@srmist.edu.in';
const COLLEGE_ROLL_NUMBER = 'RA2311027020001';

const VALID_EDGE_RE = /^[A-Z]->[A-Z]$/;

function processData(data) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const dupEdgesSet = new Set();
  const validEdges = [];

  const nodeOrder = {};
  let orderIdx = 0;

  for (const rawEntry of data) {
    const entry = (typeof rawEntry === 'string' ? rawEntry : String(rawEntry)).trim();

    if (!entry || !VALID_EDGE_RE.test(entry)) {
      invalidEntries.push(entry || String(rawEntry));
      continue;
    }

    const [parent, child] = entry.split('->');

    if (parent === child) {
      invalidEntries.push(entry);
      continue;
    }

    if (nodeOrder[parent] === undefined) nodeOrder[parent] = orderIdx++;
    if (nodeOrder[child] === undefined) nodeOrder[child] = orderIdx++;

    if (seenEdges.has(entry)) {
      if (!dupEdgesSet.has(entry)) {
        dupEdgesSet.add(entry);
        duplicateEdges.push(entry);
      }
      continue;
    }

    seenEdges.add(entry);
    validEdges.push({ parent, child, edge: entry });
  }

  const children = {};
  const parentOf = {};

  for (const { parent, child } of validEdges) {
    if (parentOf[child] !== undefined) {
      continue;
    }
    parentOf[child] = parent;
    if (!children[parent]) children[parent] = [];
    children[parent].push(child);
  }

  const allNodes = new Set();
  for (const { parent, child } of validEdges) {
    allNodes.add(parent);
    allNodes.add(child);
  }

  if (allNodes.size === 0) {
    return buildResponse([], invalidEntries, duplicateEdges);
  }

  const undirected = {};
  for (const node of allNodes) undirected[node] = new Set();
  for (const [p, cList] of Object.entries(children)) {
    for (const c of cList) {
      undirected[p].add(c);
      undirected[c].add(p);
    }
  }

  const visitedGlobal = new Set();
  const components = [];

  const allNodesByOrder = [...allNodes].sort((a, b) => nodeOrder[a] - nodeOrder[b]);

  for (const startNode of allNodesByOrder) {
    if (visitedGlobal.has(startNode)) continue;

    const component = new Set();
    const queue = [startNode];
    visitedGlobal.add(startNode);

    while (queue.length) {
      const node = queue.shift();
      component.add(node);
      for (const neighbor of undirected[node]) {
        if (!visitedGlobal.has(neighbor)) {
          visitedGlobal.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    components.push(component);
  }

  function detectCycle(node, vis, recStack) {
    vis.add(node);
    recStack.add(node);
    for (const child of (children[node] || [])) {
      if (!vis.has(child)) {
        if (detectCycle(child, vis, recStack)) return true;
      } else if (recStack.has(child)) {
        return true;
      }
    }
    recStack.delete(node);
    return false;
  }

  function buildTree(node) {
    const result = {};
    for (const child of (children[node] || [])) {
      result[child] = buildTree(child);
    }
    return result;
  }

  function calcDepth(node) {
    const childList = children[node] || [];
    if (!childList.length) return 1;
    return 1 + Math.max(...childList.map(calcDepth));
  }

  const hierarchies = [];

  for (const component of components) {
    const compNodes = [...component].sort();
    const roots = compNodes.filter(n => parentOf[n] === undefined);

    const cycleVis = new Set();
    const recStack = new Set();
    let isCyclic = false;

    for (const node of compNodes) {
      if (!cycleVis.has(node) && detectCycle(node, cycleVis, recStack)) {
        isCyclic = true;
        break;
      }
    }

    const root = roots.length > 0 ? roots.sort()[0] : compNodes[0];

    if (isCyclic) {
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      const tree = { [root]: buildTree(root) };
      const depth = calcDepth(root);
      hierarchies.push({ root, tree, depth });
    }
  }

  return buildResponse(hierarchies, invalidEntries, duplicateEdges);
}

function buildResponse(hierarchies, invalidEntries, duplicateEdges) {
  const validTrees = hierarchies.filter(h => !h.has_cycle);
  const cyclicGroups = hierarchies.filter(h => h.has_cycle);

  let largestTreeRoot = '';
  let maxDepth = -1;

  for (const h of validTrees) {
    if (
      h.depth > maxDepth ||
      (h.depth === maxDepth && h.root < largestTreeRoot)
    ) {
      maxDepth = h.depth;
      largestTreeRoot = h.root;
    }
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: validTrees.length,
      total_cycles: cyclicGroups.length,
      largest_tree_root: largestTreeRoot,
    },
  };
}

export default function handler(req, res) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { data } = req.body || {};
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Request body must contain a "data" array.' });
    }
    res.status(200).json(processData(data));
  } catch (err) {
    console.error('[/bfhl] Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
