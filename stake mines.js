// ==UserScript==
// @name         StakeInsight Mines Predictor
// @namespace    http://tampermonkey.net/
// @version      2024-09-26
// @description  Mines predictor bot for Stake.com
// @author       You
// @match        https://stake.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

function createPopupUI() {
  const popup = document.createElement("div");
  popup.className = "popup-overlay";
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    padding: 20px;
    background-color: #FFFFFF;
    border: 2px solid #000000;
    border-radius: 8px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    width: 300px;
    z-index: 1000;
    font-family: Arial, sans-serif;
  `;

  const title = document.createElement("h3");
  title.innerText = "StakeInsight";
  title.style.cssText = `
    text-align: center;
    margin-bottom: 20px;
    color: #000000;
    font-size: 18px;
    border-bottom: 2px solid #000000;
    padding-bottom: 10px;
  `;
  popup.appendChild(title);

  const inputField = document.createElement("input");
  inputField.type = "number";
  inputField.placeholder = "Enter number of clicks";
  inputField.min = 1;
  inputField.style.cssText = `
    width: 100%;
    padding: 12px;
    background-color: #f0f0f0;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-sizing: border-box;
    font-size: 16px;
    transition: border-color 0.3s ease;
  `;
  popup.appendChild(inputField);

  const predictButton = document.createElement("button");
  predictButton.innerText = "Start Clicking";
  predictButton.style.cssText = `
    width: 100%;
    padding: 12px;
    border: none;
    background-color: #000000;
    color: #FFFFFF;
    font-size: 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  `;
  popup.appendChild(predictButton);

  predictButton.addEventListener("click", () => {
    const numberOfClicks = parseInt(inputField.value, 10);

    if (isNaN(numberOfClicks) || numberOfClicks <= 0) {
      alert("Please enter a valid number of clicks.");
      return;
    }

    performClicks(numberOfClicks);
  });

  document.body.appendChild(popup);
}

async function performClicks(clicks) {
  const allTiles = Array.from(
    document.querySelectorAll('button.tile.idle.svelte-1avx2pj[data-test="mines-tile"]')
  );

  allTiles.forEach((tile, index) => {
    tile.setAttribute("data-tile-number", index + 1);
  });

  const safeTiles = deduceSafeTiles(allTiles);
  const mineCount = getMineCount();

  if (safeTiles.length < mineCount) {
    alert("The number of mines exceeds the deduced safe tiles!");
    return;
  }

  const shuffledTiles = safeTiles.sort(() => Math.random() - 0.5);

  for (let i = 0; i < clicks && i < shuffledTiles.length; i++) {
    const tile = shuffledTiles[i];

    console.log(`Attempting to shadow-click tile #${tile.getAttribute("data-tile-number")} to check for mines or bad tiles.`);
    const shadowClickSuccess = await shadowClick(tile);

    if (shadowClickSuccess) {
      console.log(`Shadow-click successful on tile #${tile.getAttribute("data-tile-number")}. Now proceeding to click.`);
      tile.click();
    } else {
      console.log(`Shadow-click failed on tile #${tile.getAttribute("data-tile-number")}. Skipping this tile.`);
    }

    await delay(1500); // Add a delay between clicks
  }
}

function getMineCount() {
  const mineCountSelector = document.querySelector('select[data-test="mines-count"]');
  return mineCountSelector ? parseInt(mineCountSelector.value, 10) : 0;
}

function deduceSafeTiles(tiles) {
  const safeTiles = [];

  tiles.forEach(tile => {
    const numberElement = tile.querySelector('div.number.svelte-1v6s3g3');
    if (numberElement) {
      const number = parseInt(numberElement.innerText, 10);
      const adjacentTiles = getAdjacentTiles(tile);

      if (number === 0) {
        safeTiles.push(...adjacentTiles);
      }
    }
  });

  return [...new Set(safeTiles)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function shadowClick(tile) {
  try {
    console.log(`Simulating shadow-click on tile #${tile.getAttribute("data-tile-number")}`);
    tile.classList.add("shadow-click");

    await delay(300);

    tile.classList.remove("shadow-click");

    if (isBadGatewayTile(tile)) {
      console.log(`Tile #${tile.getAttribute("data-tile-number")} detected as bad gateway.`);
      return false;
    }

    return true; // Shadow click successful
  } catch (error) {
    console.error(`Error during shadow-click on tile #${tile.getAttribute("data-tile-number")}:`, error);
    return false;
  }
}

function isBadGatewayTile(tile) {
  const badGatewayElement = tile.querySelector('div.bad-gateway.svelte-xyz123');
  return badGatewayElement !== null;
}

function getAdjacentTiles(tile) {
  const allTiles = Array.from(
    document.querySelectorAll('button.tile.idle.svelte-1avx2pj[data-test="mines-tile"]')
  );

  const tileNumber = parseInt(tile.getAttribute("data-tile-number"), 10);
  const adjacentTiles = [];

  const gridSize = Math.sqrt(allTiles.length);
  const tileIndex = tileNumber - 1;

  const neighbors = [
    tileIndex - gridSize,
    tileIndex + gridSize,
    tileIndex - 1,
    tileIndex + 1
  ];

  neighbors.forEach(index => {
    if (index >= 0 && index < allTiles.length) {
      adjacentTiles.push(allTiles[index]);
    }
  });

  return adjacentTiles;
}

(function () {
  createPopupUI();
})();
