const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Initialize global variables for network graph
let networkGraph, subtreeSizes, subtreeDistanceSum, totalDistance, totalNodes;

// Function to calculate subtree sizes and distance sums from each node
function calculateSubtreeDistances(currentNode = 0, parentNode = -1) {
    subtreeSizes[currentNode] = 1;  // Initialize size of the current node's subtree
    subtreeDistanceSum[currentNode] = 0;  // Initialize distance sum from current node

    for (let neighbor of networkGraph[currentNode]) {
        if (neighbor === parentNode) continue;  // Skip the parent node
        calculateSubtreeDistances(neighbor, currentNode);  // Recursive DFS

        // Update distance sum and subtree size
        subtreeDistanceSum[currentNode] += subtreeSizes[neighbor] + subtreeDistanceSum[neighbor];
        subtreeSizes[currentNode] += subtreeSizes[neighbor];
    }
}

// Function to calculate total distances for each node based on parent's distances
function calculateTotalDistances(currentNode = 0, parentNode = -1) {
    if (parentNode !== -1) {
        // Calculate distance sum for the current node based on the parent's data
        const remainingDistanceSum = totalDistance[parentNode] - (subtreeDistanceSum[currentNode] + subtreeSizes[currentNode]);
        const parentToNodeDistance = remainingDistanceSum + (subtreeSizes[0] - subtreeSizes[currentNode]);
        totalDistance[currentNode] = subtreeDistanceSum[currentNode] + parentToNodeDistance;
    } else {
        // For the root node, just use the calculated distance sum from the subtree
        totalDistance[currentNode] = subtreeDistanceSum[currentNode];
    }

    for (let neighbor of networkGraph[currentNode]) {
        if (neighbor === parentNode) continue;  // Skip the parent node
        calculateTotalDistances(neighbor, currentNode);  // Recursive DFS
    }
}

// Function to get the nodes with the minimum total distance
function getOptimalNodes() {
    const minDistance = Math.min(...totalDistance);  // Find the smallest distance
    const optimalNodes = [];

    // Collect all nodes with the minimum distance
    for (let i = 0; i < totalDistance.length; i++) {
        if (totalDistance[i] === minDistance) {
            optimalNodes.push(i);
        }
    }

    return { minDistance, optimalNodes };
}

// Endpoint to calculate total distances for network latency optimization
app.post('/api/optimize', (req, res) => {
    const { n, edges } = req.body;  // Extract number of nodes and edges
    totalNodes = n;

    // Validate input
    if (!Number.isInteger(totalNodes) || totalNodes <= 0 || !Array.isArray(edges)) {
        return res.status(400).json({ error: "Invalid input data." });
    }

    if (totalNodes === 1) {
        return res.json({ optimalNodes: [0], minDistance: 0, totalDistance: [0] });  // Single node case
    }

    // Initialize network graph
    networkGraph = Array.from({ length: n }, () => []);  
    subtreeSizes = new Array(n).fill(0);  
    subtreeDistanceSum = new Array(n).fill(0);  
    totalDistance = new Array(n).fill(0);  

    // Build the adjacency list representation of the network
    for (let edge of edges) {
        if (edge.length !== 2 || edge[0] < 0 || edge[0] >= n || edge[1] < 0 || edge[1] >= n) {
            return res.status(400).json({ error: "Invalid edge." });
        }
        if (edge[0] === edge[1]) {
            return res.status(400).json({ error: "Self-loops are not allowed." });
        }
        networkGraph[edge[0]].push(edge[1]);  // Add edge to node's neighbors
        networkGraph[edge[1]].push(edge[0]);  // Undirected edge
    }

    // Perform the two DFS to calculate distances
    calculateSubtreeDistances();
    calculateTotalDistances();

    // Get optimal nodes
    const { minDistance, optimalNodes } = getOptimalNodes();

    // Send the response with the optimal nodes and total distances
    res.json({
        optimalNodes,  // All nodes with the minimum total distance
        minDistance,   // The smallest total distance value
        totalDistance  // Total distance for each node
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
