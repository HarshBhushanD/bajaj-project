import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const IDENTITY = {
  user_id: "harshbhushandixit_12062004",
  email_id: "hd6843@srmist.edu.in",
  college_roll_number: "RA2311028030018",
};

function isValidEdgeString(s) {
  return /^[A-Z]->[A-Z]$/.test(s);
}

function buildNestedTree(root, childrenByParent) {
  const dfs = (node) => {
    const children = [...(childrenByParent.get(node) ?? [])].sort();
    const out = {};
    for (const child of children) out[child] = dfs(child);
    return out;
  };
  return { [root]: dfs(root) };
}

function computeDepth(root, childrenByParent) {
  const dfs = (node) => {
    const children = childrenByParent.get(node);
    if (!children || children.length === 0) return 1;
    let best = 0;
    for (const child of children) best = Math.max(best, dfs(child));
    return 1 + best;
  };
  return dfs(root);
}

function detectCycleInComponent(nodes, childrenByParent) {
  const nodeSet = new Set(nodes);
  const color = new Map(); // 0 unvisited, 1 visiting, 2 done

  const visit = (u) => {
    color.set(u, 1);
    for (const v of childrenByParent.get(u) ?? []) {
      if (!nodeSet.has(v)) continue;
      const c = color.get(v) ?? 0;
      if (c === 1) return true;
      if (c === 0 && visit(v)) return true;
    }
    color.set(u, 2);
    return false;
  };

  for (const n of nodeSet) {
    if ((color.get(n) ?? 0) === 0 && visit(n)) return true;
  }
  return false;
}

function getComponents(allNodes, undirectedAdj) {
  const seen = new Set();
  const comps = [];

  for (const start of allNodes) {
    if (seen.has(start)) continue;
    const q = [start];
    seen.add(start);
    const comp = [];
    while (q.length) {
      const u = q.pop();
      comp.push(u);
      for (const v of undirectedAdj.get(u) ?? []) {
        if (seen.has(v)) continue;
        seen.add(v);
        q.push(v);
      }
    }
    comps.push(comp.sort());
  }

  return comps;
}

function processEdges(input) {
  const invalid_entries = [];
  const duplicate_edges = [];

  const seenEdge = new Set();
  const duplicateEdgeOnce = new Set();
  const parentByChild = new Map(); // child -> parent (first wins)

  const childrenByParent = new Map(); // parent -> Set(children)
  const indegree = new Map(); // node -> number
  const allNodes = new Set();
  const undirectedAdj = new Map(); // node -> Set(neighbors)

  const addUndirected = (a, b) => {
    if (!undirectedAdj.has(a)) undirectedAdj.set(a, new Set());
    if (!undirectedAdj.has(b)) undirectedAdj.set(b, new Set());
    undirectedAdj.get(a).add(b);
    undirectedAdj.get(b).add(a);
  };

  const incIndegree = (n) => indegree.set(n, (indegree.get(n) ?? 0) + 1);
  const ensureNode = (n) => {
    allNodes.add(n);
    if (!indegree.has(n)) indegree.set(n, indegree.get(n) ?? 0);
  };

  const data = Array.isArray(input?.data) ? input.data : null;
  if (!data) {
    return {
      hierarchies: [],
      invalid_entries: ["<invalid_request_body>"],
      duplicate_edges: [],
      summary: { total_trees: 0, total_cycles: 0, largest_tree_root: "" },
    };
  }

  for (const raw of data) {
    const trimmed = String(raw ?? "").trim();

    if (!trimmed || !isValidEdgeString(trimmed)) {
      invalid_entries.push(trimmed);
      continue;
    }

    const parent = trimmed[0];
    const child = trimmed[3];

    if (parent === child) {
      invalid_entries.push(trimmed);
      continue;
    }

    if (seenEdge.has(trimmed)) {
      if (!duplicateEdgeOnce.has(trimmed)) {
        duplicateEdgeOnce.add(trimmed);
        duplicate_edges.push(trimmed);
      }
      continue;
    }
    seenEdge.add(trimmed);

    // multi-parent: first parent wins; discard later silently
    if (parentByChild.has(child)) continue;
    parentByChild.set(child, parent);

    ensureNode(parent);
    ensureNode(child);
    incIndegree(child);

    if (!childrenByParent.has(parent)) childrenByParent.set(parent, new Set());
    childrenByParent.get(parent).add(child);
    addUndirected(parent, child);
  }

  // Normalize childrenByParent to arrays for stable iteration and faster recursion
  const childrenByParentArr = new Map(
    [...childrenByParent.entries()].map(([p, set]) => [p, [...set]])
  );

  const nodesArr = [...allNodes].sort();
  const comps = getComponents(nodesArr, undirectedAdj);

  const hierarchies = [];
  let total_cycles = 0;

  for (const comp of comps) {
    const hasCycle = detectCycleInComponent(comp, childrenByParentArr);

    const roots = comp.filter((n) => (indegree.get(n) ?? 0) === 0).sort();
    const fallbackRoot = comp[0] ?? "";
    const cycleRoot = roots[0] ?? fallbackRoot;

    if (hasCycle) {
      total_cycles += 1;
      hierarchies.push({
        root: cycleRoot,
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    for (const root of roots.length ? roots : [fallbackRoot]) {
      if (!root) continue;
      hierarchies.push({
        root,
        tree: buildNestedTree(root, childrenByParentArr),
        depth: computeDepth(root, childrenByParentArr),
      });
    }
  }

  const nonCyclic = hierarchies.filter((h) => !h.has_cycle);
  let largest_tree_root = "";
  let bestDepth = -1;
  for (const h of nonCyclic) {
    if (h.depth > bestDepth) {
      bestDepth = h.depth;
      largest_tree_root = h.root;
    } else if (h.depth === bestDepth && h.root < largest_tree_root) {
      largest_tree_root = h.root;
    }
  }

  return {
    hierarchies,
    invalid_entries: invalid_entries.filter((s) => s !== ""),
    duplicate_edges,
    summary: {
      total_trees: nonCyclic.length,
      total_cycles,
      largest_tree_root,
    },
  };
}

app.post("/bfhl", (req, res) => {
  const processed = processEdges(req.body);
  res.json({
    ...IDENTITY,
    ...processed,
  });
});

app.get("/", (_req, res) => {
  res.type("text").send("BFHL API. POST /bfhl");
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

