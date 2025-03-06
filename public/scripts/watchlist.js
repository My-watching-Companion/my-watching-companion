// Debounce function to prevent functions from running multiple times in a row
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Modals management
async function toggleAddArtworkModal() {
  const addArtworkModal = document.getElementById("add-artwork");
  addArtworkModal.toggleAttribute("hidden");

  const addArtworkContainer = document.getElementById("add-artwork-container");

  const resultBox = document.getElementById("result-box");
  resultBox.classList.remove("error", "success");
  resultBox.classList.add("invisible");

  addArtworkModal.onclick = (event) => {
    if (!addArtworkContainer.contains(event.target))
      addArtworkModal.toggleAttribute("hidden");
  };
}

// Load watchlists
async function setLoadingArtworks(show) {
  const status = document.getElementById("status-loading");
  status.style.display = show ? "flex" : "none";
}

async function setEmptyArtworks(show) {
  const status = document.getElementById("status-empty");
  status.style.display = show ? "flex" : "none";
}

async function loadArtworks() {
  setLoadingArtworks(true);
  setEmptyArtworks(false);

  const watchlist = await fetch("/api/user/watchlists/" + selectedList, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }).then((response) => response.json());

  const artworksContainer = document.getElementById("artworks");

  if (watchlist.artworks.length === 0) {
    setEmptyArtworks(true);
    setLoadingArtworks(false);
    return;
  }

  artworksContainer.innerHTML = "";

  watchlist.artworks.forEach((artwork) => {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("artwork-card");
    cardDiv.setAttribute("name", artwork.artwork_name);

    const cardPoster = document.createElement("img");
    cardPoster.crossOrigin = "anonymous";
    cardPoster.src = `https://image.tmdb.org/t/p/w500${artwork.artwork_poster}`;
    cardPoster.alt = `${artwork.artwork_name}`;

    cardPoster.addEventListener("load", () => {
      const dominantColor = new ColorThief().getColor(cardPoster);
      const shadowColor = (opacity) =>
        `rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, ${opacity})`;
      cardPoster.style.boxShadow = `0px 0px 5px 5px ${shadowColor(0.7)}`;
      cardPoster.onmouseover = () => {
        cardPoster.style.boxShadow = `0px 0px 0px 10px ${shadowColor(1)}`;
      };
      cardPoster.onmouseout = () => {
        cardPoster.style.boxShadow = `0px 0px 5px 5px ${shadowColor(0.7)}`;
      };
    });

    cardPoster.onclick = () => {
      window.location.href = `/artwork/${artwork.artwork_id}`;
    };

    cardDiv.appendChild(cardPoster);
    artworksContainer.appendChild(cardDiv);
  });

  setLoadingArtworks(false);
  debouncedFilterArtworks();
}

loadArtworks();

// Filter artworks
async function filterArtworks() {
  const artworksContainer = document.getElementById("artworks");
  const filter = document.getElementById("quick-search").value;

  for (const artwork of artworksContainer.children) {
    if (
      artwork.getAttribute("name").toLowerCase().includes(filter.toLowerCase())
    )
      artwork.style.display = "flex";
    else artwork.style.display = "none";
  }

  if (
    Array.from(artworksContainer.children).every(
      (artwork) => artwork.style.display === "none"
    )
  )
    setEmptyArtworks(true);
  else setEmptyArtworks(false);
}

const debouncedFilterArtworks = debounce(filterArtworks, 250);

// Add artworks search
async function addArtworkSearch() {
  const searchBar = document.getElementById("add-artwork-search");
  const searchedArtwork = searchBar.value;
  const searchResultsContainer = document.getElementById("searched-artworks");

  if (searchedArtwork === "") {
    searchResultsContainer.innerHTML = "";
    return;
  }

  let artworks = await fetch("/api/searchartworks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ search: searchedArtwork }),
  });
  artworks = await artworks.json();

  searchResultsContainer.innerHTML = "";

  // Display searched artworks
  for (const artwork of artworks) {
    const artworkElement = document.createElement("div");
    artworkElement.classList.add("searched-artwork");

    const banner = document.createElement("img");
    banner.src = `https://image.tmdb.org/t/p/w500${artwork.poster_path}`;
    banner.alt = artwork.title;

    const info = document.createElement("div");
    info.classList.add("info");

    const titleRow = document.createElement("div");
    titleRow.classList.add("title-row");

    const title = document.createElement("h3");
    title.textContent = artwork.title;

    const metadata = document.createElement("div");
    metadata.classList.add("metadata");
    metadata.textContent = `${new Date(
      artwork.release_date
    ).getFullYear()} • ${artwork.genres.join(", ")}`;

    const description = document.createElement("div");
    description.classList.add("description");
    description.textContent =
      (artwork.overview || "Aucune description disponible.")
        .split(" ")
        .slice(0, 25)
        .join(" ") + (artwork.overview?.split(" ").length > 25 ? "..." : "");

    const addButton = document.createElement("button");
    addButton.textContent = "Ajouter";
    addButton.classList.add("btn-primary");
    addButton.onclick = () => addArtworkToList(artwork);

    titleRow.appendChild(title);
    titleRow.appendChild(metadata);

    info.appendChild(titleRow);
    info.appendChild(description);
    info.appendChild(addButton);

    artworkElement.appendChild(banner);
    artworkElement.appendChild(info);

    searchResultsContainer.appendChild(artworkElement);
  }
}

const debouncedAddArtworkSearch = debounce(addArtworkSearch, 250);

async function addArtworkToList(artwork) {
  let response = await fetch(`/api/user/watchlists/${selectedList}/artworks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      artwork: {
        id: artwork.id,
        title: artwork.title,
        poster_path: artwork.poster_path,
      },
    }),
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
    loadArtworks();
  }
}
