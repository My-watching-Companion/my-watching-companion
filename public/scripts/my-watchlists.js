// Modals and custom selects
async function toggleAddListModal() {
  const addListModal = document.getElementById("add-list");
  addListModal.toggleAttribute("hidden");

  const addListContainer = document.getElementById("add-list-container");

  const resultBox = document.getElementById("result-box");
  resultBox.classList.remove("error", "success");
  resultBox.classList.add("invisible");

  addListModal.onclick = (event) => {
    if (!addListContainer.contains(event.target))
      addListModal.toggleAttribute("hidden");
  };
}

// Load watchlists
async function loadWatchlists() {
  setLoadingWatchlists();

  const watchlists = await fetch("/api/user/watchlists").then((response) =>
    response.json()
  );

  const watchlistsContainer = document.getElementById("watchlists");

  if (watchlists.length === 0) {
    setNoWatchlists();
    return;
  }

  watchlistsContainer.innerHTML = "";

  watchlists.forEach((watchlist) => {
    const linkElement = document.createElement("a");
    linkElement.href = `/my-watchlists/${watchlist.list_name}`;
    linkElement.style.textDecoration = "none";

    const cardDiv = document.createElement("div");
    cardDiv.classList.add("watchlist-card");

    const cardPoster = document.createElement("img");
    cardPoster.crossOrigin = "anonymous";
    cardPoster.src = watchlist.cover_url
      ? `https://image.tmdb.org/t/p/w500${watchlist.cover_url}`
      : "assets/placeholder.png";
    cardPoster.alt = `${watchlist.list_name}`;

    cardPoster.addEventListener("load", () => {
      const dominantColor = new ColorThief().getColor(cardPoster);
      const shadowColor = (opacity) =>
        `rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, ${opacity})`;
      cardPoster.style.boxShadow = `0px 0px 5px 5px ${shadowColor(0.7)}`;
      linkElement.onmouseover = () => {
        cardPoster.style.boxShadow = `0px 0px 0px 10px ${shadowColor(1)}`;
      };
      linkElement.onmouseout = () => {
        cardPoster.style.boxShadow = `0px 0px 5px 5px ${shadowColor(0.7)}`;
      };
    });

    const titleDiv = document.createElement("div");
    titleDiv.classList.add("watchlist-title");
    titleDiv.textContent = watchlist.list_name;

    cardDiv.appendChild(cardPoster);
    cardDiv.appendChild(titleDiv);
    linkElement.appendChild(cardDiv);
    watchlistsContainer.appendChild(linkElement);
  });
}

async function setLoadingWatchlists() {
  const watchlistsContainer = document.getElementById("watchlists");
  watchlistsContainer.innerHTML = `<p>Loading...</p>`;
}

async function setNoWatchlists() {
  const watchlistsContainer = document.getElementById("watchlists");
  watchlistsContainer.innerHTML = `<p>Vous ne possédez aucune liste...</p>`;
}

loadWatchlists();

// Create watchlist
async function createWatchlist() {
  // Handle request
  const name = document.getElementById("add-list-search").value;

  let response = await fetch("/api/user/watchlists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  response = await response.json();

  // Display success or error message
  const resultBox = document.getElementById("result-box");

  if (response.error) {
    resultBox.innerHTML = response.error;
    resultBox.classList.remove("invisible", "success");
    resultBox.classList.add("visible", "error");
    return;
  }

  if (response.message) {
    resultBox.innerHTML = response.message;
    resultBox.classList.remove("invisible", "error");
    resultBox.classList.add("visible", "success");
    loadWatchlists();
  }
}
