const canvas = document.getElementById("canvas-grid");
const gridContainer = document.querySelector(".grid-container");
const form = document.querySelector(".form");
const placeStartBtn = document.getElementById("place-start");
const placeEndBtn = document.getElementById("place-end");
const placeWallBtn = document.getElementById("place-walls");
const resetBtn = document.getElementById("reset");

/* CONSTANTS & Global variables*/
const cellSize = 30;
const rows = 40;
const cols = 40;
let grid;
let isPlacingStart = false;
let isPlacingEnd = false;
let isPlacingWalls = false;

// Functions

function setCanvasDimensions() {
  canvas.height = gridContainer.clientHeight;
  canvas.width = gridContainer.clientWidth;
}

function initializeGrid() {
  const grid = [];
  for (let row = 0; row < rows; row++) {
    const currentRow = [];
    for (let col = 0; col < cols; col++) {
      currentRow.push({
        row,
        col,
        isStart: false,
        isEnd: false,
        isWall: false,
        isVisited: false,
        isPath: false,
        previousNode: null,
        distance: Infinity,
      });
    }
    grid.push(currentRow);
  }
  return grid;
}
grid = initializeGrid();

function drawGrid() {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Canvas context is not available.");
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // need to understand cellWidth/Height?
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      const x = col * cellWidth;
      const y = row * cellHeight;

      // Draw cell background
      if (cell.isStart) ctx.fillStyle = "green";
      else if (cell.isEnd) ctx.fillStyle = "red";
      else if (cell.isPath) ctx.fillStyle = "yellow";
      else if (cell.isVisited) ctx.fillStyle = "lightblue";
      else if (cell.isWall) ctx.fillStyle = "black";
      else ctx.fillStyle = "white";

      ctx.fillRect(x, y, cellWidth, cellHeight);

      // Draw cell borders
      ctx.strokeStyle = "grey";
      ctx.strokeRect(x, y, cellWidth, cellHeight);
    }
  }
}

function resetAll() {
  grid = initializeGrid();
  drawGrid();
}

// Function to handle node placement
function handleNodePlacement(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const row = Math.floor(mouseY / (canvas.height / rows));
  const col = Math.floor(mouseX / (canvas.width / cols));

  if (row >= 0 && row < rows && col >= 0 && col < cols) {
    // cell or node
    const cell = grid[row][col];

    if (isPlacingStart && !cell.isWall && !cell.isEnd) {
      grid.forEach((row) => {
        row.forEach((cell) => {
          cell.isStart = false;
        });
      });
      cell.isStart = true;
    } else if (isPlacingEnd && !cell.isWall && !cell.isStart) {
      grid.forEach((row) => {
        row.forEach((cell) => {
          cell.isEnd = false;
        });
      });
      cell.isEnd = true;
    } else if (isPlacingWalls && !cell.isStart && !cell.isEnd) {
      cell.isWall = !cell.isWall; // Toggle wall
    }

    setCanvasDimensions();
    drawGrid();
  }
}

/* DIJKSTRA ALGORITHM */
function getAllNodes(grid) {
  const nodes = [];
  for (const row of grid) {
    for (const node of row) nodes.push(node);
  }

  return nodes;
}

// ?
function getNeighbors(node, grid) {
  const neighbors = [];
  const { row, col } = node;

  if (row > 0) neighbors.push(grid[row - 1][col]); //up
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]); //down
  if (col > 0) neighbors.push(grid[row][col - 1]); //left
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]); //right

  return neighbors.filter(
    (neighbor) => !neighbor.isWall && !neighbor.isVisited
  );
}

function findShortestPath(endNode) {
  const path = [];
  let currentNode = endNode;

  while (currentNode != null) {
    path.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return path;
}

function dijkstra(startNode, endNode, grid) {
  const visitedNodes = [];
  const unvisitedNodes = getAllNodes(grid);

  startNode.distance = 0;

  while (unvisitedNodes.length > 0) {
    // simulating priority queue
    unvisitedNodes.sort((a, b) => a.distance - b.distance);

    const closestNode = unvisitedNodes.shift(); // extract first item of unvisitedNodes array

    if (closestNode.isWall) continue; // disregard walls

    // If the closest node's distance is Infinity, the end node is unreachable? /* my catch  */
    if (closestNode.distance === Infinity) {
      console.log("the end node is unreachable");
      return { visitedNodes, shortestPath: [] };
    }

    closestNode.isVisited = true;
    visitedNodes.push(closestNode);

    if (closestNode === endNode) {
      return { visitedNodes, shortestPath: findShortestPath(endNode) };
    }

    const neighbors = getNeighbors(closestNode, grid);

    for (const neighbor of neighbors) {
      const newDistance = closestNode.distance + 1;
      if (newDistance < neighbor.distance) {
        neighbor.distance = newDistance;
        neighbor.previousNode = closestNode;
      }
    }
  }

  return { visitedNodes, shortestPath: [] };
}

/* Function to  visualize the selected algorithem*/
async function visualizeAlgorithm(algorithm, grid, startNode, endNode) {
  if (!algorithm) {
    console.error("Algorithm not found or not implemented yet.");
    return;
  }

  const { visitedNodes, shortestPath } = algorithm(startNode, endNode, grid);

  grid.forEach((row) =>
    row.forEach((cell) => {
      cell.isVisited = false;
      cell.isPath = false;
      cell.distance = Infinity;
      cell.previousNode = null;
    })
  );

  // Highlight visited nodes
  for (const node of visitedNodes) {
    node.isVisited = true;
    drawGrid();
    await sleep(10); // Add a delay for visualization
  }

  if (shortestPath.length === 0 && visitedNodes.length > 0) {
    console.log(`You shall not pass! ⚠`);
    return;
  }

  let steps = 0;
  // Highlight the shortest path
  for (const node of shortestPath) {
    node.isPath = true;
    console.log(++steps);

    drawGrid();
    await sleep(30); // Add a delay for visualization
  }
}

//Helper function to add a delay
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Map algorithm names to functions
const algorithms = {
  dijkstra: dijkstra,
};

// the run-algorithm button
document.getElementById("run-algorithm").addEventListener("click", () => {
  const startNode = grid.flat().find((cell) => cell.isStart);
  const endNode = grid.flat().find((cell) => cell.isEnd);

  if (startNode && endNode) {
    // Get the selected algorithm
    const selectedAlgorithm = document.getElementById("algorithm-select").value;
    const algorithmFunction = algorithms[selectedAlgorithm]; // e.g dijkstra;

    if (algorithmFunction) {
      // Run the selected algorithm
      visualizeAlgorithm(algorithmFunction, grid, startNode, endNode);
    } else {
      console.error("Algorithm not found or not implemented yet.");
      alert("The selected algorithm is not implemented yet.");
      return;
    }
  } else {
    alert("Please place both start and end nodes.");
  }
});

/* Buttons function handlers */
placeStartBtn.addEventListener("click", () => {
  isPlacingStart = true;
  isPlacingEnd = false;
  isPlacingWalls = false;
});
placeEndBtn.addEventListener("click", () => {
  isPlacingEnd = true;
  isPlacingStart = false;
  isPlacingWalls = false;
});
placeWallBtn.addEventListener("click", () => {
  isPlacingWalls = true;
  isPlacingStart = false;
  isPlacingEnd = false;
});

resetBtn.addEventListener("click", resetAll);

canvas.addEventListener("mousedown", handleNodePlacement);

canvas.addEventListener("mousemove", (e) => {
  if (isPlacingWalls && e.buttons === 1) {
    handleNodePlacement(e);
  }
});

function initializeApp() {
  setCanvasDimensions();
  drawGrid();
}

// Start the app
initializeApp();
