import React, { useState } from 'react';
import axios from 'axios';
import './NetworkOptimizer.css';  // Include your CSS for styling

const NetworkOptimizer = () => {
  const [numNodes, setNumNodes] = useState(2); // Default number of nodes
  const [edgesInput, setEdgesInput] = useState('0,1'); // Default example edges input
  const [results, setResults] = useState([]);
  const [bestNode, setBestNode] = useState('');
  const [whyInfo, setWhyInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);  // New state to show detailed distances

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResults([]);
    setBestNode('');
    setWhyInfo('');
    setShowDetails(false);

    // Parse the edges input into a suitable format
    const edges = edgesInput.split('\n').map(line => line.split(',').map(Number));

    // Validate the input
    if (isNaN(numNodes) || numNodes <= 0 || edges.length === 0) {
      setError('Please provide valid inputs for number of nodes and edges.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/optimize', { n: numNodes, edges });
      setResults(response.data);

      // Find the best nodes with the smallest total distance
      const minDistance = response.data.minDistance;
      const bestNodes = response.data.optimalNodes.map(node => `Node ${node}`).join(', '); // Create a string of all optimal nodes
      setBestNode(`${bestNodes} are best suitable for Network Latency optimization.`);

      // Format the detailed distances information
      const detailedInfo = response.data.totalDistance.map((distance, index) => (
        `Node ${index}: is at a distance of ${distance} from all other Nodes`
      ));
      setWhyInfo(detailedInfo);
    } catch (err) {
      setError('Failed to optimize the network. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhyClick = () => {
    setShowDetails(true);  // Show the detailed distances when the button is clicked
  };

  return (
    <div className="network-optimizer">
      <h1>Network Latency Optimization</h1>
      <div className="input-group">
        <label>Number of Nodes:</label>
        <input
          type="number"
          value={numNodes}
          onChange={(e) => setNumNodes(Number(e.target.value))}
        />
      </div>

      <div className="input-group">
        <label>Edges (format: node1,node2):</label>
        <textarea
          value={edgesInput}
          onChange={(e) => setEdgesInput(e.target.value)}
        />
      </div>

      <button className="optimize-btn" onClick={handleSubmit}>Optimize Network</button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {bestNode && <h3>{bestNode}</h3>}

      {bestNode && (
        <button className="why-btn" onClick={handleWhyClick}>Want to know why?</button>
      )}

      {showDetails && (
        <div className="details">
          <h4>Details of Total Distances:</h4>
          <ul>
            {whyInfo && whyInfo.map((info, index) => <li key={index}>{info}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NetworkOptimizer;
