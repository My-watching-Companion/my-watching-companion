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
  setLoadingWatchlists(true);
  setEmptyWatchlists(false);

  const watchlists = await fetch("/api/user/watchlists", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }).then((response) => response.json());

  const watchlistsContainer = document.getElementById("watchlists");

  if (watchlists.length === 0) {
    setEmptyWatchlists(true);
    setLoadingWatchlists(false);
    return;
  }

  watchlistsContainer.innerHTML = "";

  watchlists.forEach((watchlist) => {
    const linkElement = document.createElement("a");
    linkElement.href = `/my-watchlists/${watchlist.list_name}`;
    linkElement.style.textDecoration = "none";
    linkElement.setAttribute("name", watchlist.list_name);

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

  setLoadingWatchlists(false);
  debouncedFilterWatchlists();
}

async function setLoadingWatchlists(show) {
  const status = document.getElementById("status-loading");
  status.style.display = show ? "flex" : "none";
}

async function setEmptyWatchlists(show) {
  const status = document.getElementById("status-empty");
  status.style.display = show ? "flex" : "none";
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

// Filter artworks
async function filterWatchlists() {
  const watchlistsContainer = document.getElementById("watchlists");
  const filter = document.getElementById("quick-search").value;

  for (const watchlist of watchlistsContainer.children) {
    if (
      watchlist
        .getAttribute("name")
        .toLowerCase()
        .includes(filter.toLowerCase())
    )
      watchlist.style.display = "flex";
    else watchlist.style.display = "none";
  }

  if (
    Array.from(watchlistsContainer.children).every(
      (watchlist) => watchlist.style.display === "none"
    )
  )
    setEmptyWatchlists(true);
  else setEmptyWatchlists(false);
}

const debouncedFilterWatchlists = debounce(filterWatchlists, 250);
