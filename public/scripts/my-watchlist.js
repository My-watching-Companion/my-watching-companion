// Debounce function to prevent functions from running multiple times in a row
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Modals and custom selects
async function toggleAddArtworkModal() {
  const addArtworkModal = document.getElementById("add-artwork");
  addArtworkModal.toggleAttribute("hidden");

  const addArtworkContainer = document.getElementById("add-artwork-container");

  addArtworkModal.onclick = (event) => {
    if (!addArtworkContainer.contains(event.target))
      addArtworkModal.toggleAttribute("hidden");
  };
}

class ListSelectionModal {
  constructor() {
    this.modal = document.getElementById("list-selection");
    this.listsContainer = document.getElementById("user-lists");
    this.activeSelector = null;
    this.clickOutsideHandler = null;
  }

  async show(listSelector) {
    if (this.activeSelector === listSelector) {
      this.hide();
      return;
    }

    this.activeSelector = listSelector;
    await this.loadLists();

    this.modal.style.display = "flex";
    this.updatePosition();

    this.clickOutsideHandler = (event) => {
      if (
        !this.modal.contains(event.target) &&
        !listSelector.contains(event.target)
      ) {
        this.updateSelectedLists();
        this.hide();
      }
    };
    document.addEventListener("click", this.clickOutsideHandler);
  }

  hide() {
    this.modal.style.display = "none";
    if (this.clickOutsideHandler) {
      document.removeEventListener("click", this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
    this.activeSelector = null;
  }

  updatePosition() {
    const rect = this.activeSelector.getBoundingClientRect();
    this.modal.style.position = "fixed";
    this.modal.style.top = `${rect.bottom + window.scrollY + 10}px`;
    this.modal.style.left = `${rect.right - this.modal.offsetWidth}px`;
  }

  async loadLists() {
    const selectedLists = this.activeSelector.getAttribute("lists").split(", ");
    this.listsContainer.innerHTML = "";

    let lists = await fetch("/api/getuserlists");
    lists = await lists.json();

    for (const list of lists) {
      const listElement = document.createElement("p");
      listElement.innerText = list.list_name;
      listElement.classList.add("list");
      if (selectedLists.includes(list.list_name)) {
        listElement.classList.add("selected");
      }
      listElement.onclick = () => listElement.classList.toggle("selected");
      this.listsContainer.appendChild(listElement);
    }
  }

  updateSelectedLists() {
    const lists = [];
    this.listsContainer.childNodes.forEach((element) => {
      if (
        element.classList.contains("list") &&
        element.classList.contains("selected")
      ) {
        lists.push(element.innerText);
      }
    });
    this.activeSelector.setAttribute("lists", lists.join(", "));
  }
}

// Initialize the modal manager
const listSelectionModal = new ListSelectionModal();

async function toggleListSelection(listSelector) {
  listSelectionModal.show(listSelector);
}

// Artworks load/search
async function loadArtworks() {
  const artworksContainer = document.getElementById("artworks");
  artworksContainer.innerHTML = "";
  const searchedArtwork = document.getElementById("quick-search").value.trim();
  const selectedLists = document
    .getElementById("selected-lists")
    .attributes.getNamedItem("lists")
    .value.split(", ");

  // Fetch and filter the user's artworks
  let artworks = await fetch("/api/getuserartworks");
  artworks = await artworks.json();

  artworks = artworks.filter(
    (artwork, index) =>
      artwork.artwork_name !== null &&
      artwork.artwork_name
        .toLowerCase()
        .includes(searchedArtwork.toLowerCase()) &&
      selectedLists.includes(artwork.list_name) &&
      artworks.indexOf(
        artworks.find((a) => artwork.artwork_name === a.artwork_name)
      ) === index
  );

  // Load artworks
  for (const artwork of artworks) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("artwork-card");

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
  }

  if (artworksContainer.children.length === 0) {
    const noArtworksAvailable = document.createElement("p");
    noArtworksAvailable.id = "no-artworks-available";
    noArtworksAvailable.innerText =
      "Aucun titre ne correspond à votre recherche.";

    artworksContainer.appendChild(noArtworksAvailable);
  } else {
    const firstNode = artworksContainer.children.item(0);

    if (firstNode.id === "no-artworks-available")
      artworksContainer.removeChild(firstNode);
  }
}
const debouncedLoadArtworks = debounce(loadArtworks, 250);

// Selected lists observer
const selectedLists = document.getElementById("selected-lists");
new MutationObserver((mutations) =>
  mutations.forEach((mutation) => {
    if (mutation.attributeName === "lists") {
      const lists = selectedLists.getAttribute("lists").split(", ");
      const span = selectedLists.querySelector("span.selected");
      span.textContent = lists[0] === "" ? "Aucune Liste" : lists.join(", ");
      debouncedLoadArtworks();
    }
  })
).observe(selectedLists, { attributes: true });

// Add selected lists observer
const toAddSelectedLists = document.getElementById("add-selected-lists");
new MutationObserver((mutations) =>
  mutations.forEach((mutation) => {
    if (mutation.attributeName === "lists") {
      const lists = toAddSelectedLists.getAttribute("lists").split(", ");
      const span = toAddSelectedLists.querySelector("span.selected");
      span.textContent = lists[0] === "" ? "Aucune Liste" : lists.join(", ");
    }
  })
).observe(toAddSelectedLists, { attributes: true });

// Load the initial artworks
loadArtworks();

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
    addButton.onclick = () => addArtworkToLists(artwork);

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

async function addArtworkToLists(artwork) {
  const selectedLists = document
    .getElementById("add-selected-lists")
    .getAttribute("lists")
    .split(", ");

  await fetch("/api/addartworktolists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      artwork: artwork,
      lists: selectedLists,
    }),
  });

  // Close modal and refresh artworks
  document.getElementById("add-artwork").toggleAttribute("hidden");
  document.getElementById("add-artwork-search").value = "";
  document.getElementById("searched-artworks").innerHTML = "";
  loadArtworks();
}
