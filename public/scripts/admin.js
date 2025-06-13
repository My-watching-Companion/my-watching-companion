// Gestion des utilisateurs
async function getUsers() {
  try {
    const response = await fetch("/api/admin/users");
    if (!response.ok)
      throw new Error("Erreur réseau lors de la récupération des utilisateurs");

    const users = await response.json();
    displayUsers(users);
  } catch (err) {
    console.error("Erreur lors de la récupération des utilisateurs:", err);
  }
}

function displayUsers(users) {
  const container = document.querySelector(".users-list");
  container.innerHTML = "";

  users.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.className = "admin-item user-item";
    userElement.innerHTML = `
      <div class="item-info">
        <img src="${user.UserProfilePicture}" alt="${user.Username}" class="user-avatar">
        <div class="user-details">
          <h4>${user.Username}</h4>
          <p>${user.EmailAddress}</p>
        </div>
      </div>
      <div class="item-actions">
        <button onclick="editUser(${user.UserID})" class="btn-secondary">
          <span class="material-symbols-rounded">edit</span>
        </button>
        <button onclick="deleteUser(${user.UserID})" class="btn-danger">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    `;
    container.appendChild(userElement);
  });
}

// Gestion des commentaires
async function getComments() {
  try {
    const response = await fetch("/api/admin/comments");
    const comments = await response.json();
    displayComments(comments);
  } catch (err) {
    console.error("Erreur lors de la récupération des commentaires:", err);
  }
}

function displayComments(comments) {
  const container = document.querySelector(".comments-list");
  container.innerHTML = "";

  comments.forEach((comment) => {
    const commentElement = document.createElement("div");
    commentElement.className = "admin-item comment-item";
    commentElement.innerHTML = `
      <div class="item-info">
        <div class="comment-details">
          <h4>${comment.Username}</h4>
          <p>${comment.CommentContent}</p>
          <small>Sur: ${comment.ArtworkName}</small>
        </div>
      </div>
      <div class="item-actions">
        <button onclick="deleteComment(${comment.CommentID})" class="btn-danger">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    `;
    container.appendChild(commentElement);
  });
}

// Gestion des titres
async function getArtworks() {
  try {
    const response = await fetch("/api/admin/artworks");
    const artworks = await response.json();
    displayArtworks(artworks);
  } catch (err) {
    console.error("Erreur lors de la récupération des titres:", err);
  }
}

// Fix the artwork poster display
function displayArtworks(artworks) {
  const container = document.querySelector(".artworks-list");
  container.innerHTML = "";

  artworks.forEach((artwork) => {
    const artworkElement = document.createElement("div");
    artworkElement.className = "admin-item artwork-item";

    // Fix the poster path to handle both full URLs and partial paths
    const posterUrl =
      artwork.ArtworkPosterImage &&
      artwork.ArtworkPosterImage.startsWith("http")
        ? artwork.ArtworkPosterImage
        : `https://image.tmdb.org/t/p/w200${artwork.ArtworkPosterImage}`;

    artworkElement.innerHTML = `
      <div class="item-info">
        <img src="${posterUrl}" alt="${artwork.ArtworkName}" class="artwork-poster">
        <div class="artwork-details">
          <h4>${artwork.ArtworkName}</h4>
        </div>
      </div>
      <div class="item-actions">
        <button onclick="editArtwork(${artwork.ArtworkID})" class="btn-secondary">
          <span class="material-symbols-rounded">edit</span>
        </button>
        <button onclick="deleteArtwork(${artwork.ArtworkID})" class="btn-danger">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    `;
    container.appendChild(artworkElement);
  });
}

// Gestion des listes
async function getLists() {
  try {
    const response = await fetch("/api/admin/lists");
    const lists = await response.json();
    displayLists(lists);
  } catch (err) {
    console.error("Erreur lors de la récupération des listes:", err);
  }
}

function displayLists(lists) {
  const container = document.querySelector(".lists-list");
  container.innerHTML = "";

  lists.forEach((list) => {
    const listElement = document.createElement("div");
    listElement.className = "admin-item list-item";
    listElement.innerHTML = `
      <div class="item-info">
        <div class="list-details">
          <h4>${list.ListName}</h4>
          <p>Créée par: ${list.Username}</p>
        </div>
      </div>
      <div class="item-actions">
        <button onclick="editList(${list.ListID})" class="btn-secondary">
          <span class="material-symbols-rounded">edit</span>
        </button>
        <button onclick="deleteList(${list.ListID})" class="btn-danger">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    `;
    container.appendChild(listElement);
  });
}

// Actions CRUD
async function deleteUser(userId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    if (response.ok) getUsers();
  } catch (err) {
    console.error("Erreur lors de la suppression de l'utilisateur:", err);
  }
}

async function deleteComment(commentId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) return;

  try {
    const response = await fetch(`/api/admin/comments/${commentId}`, {
      method: "DELETE",
    });
    if (response.ok) getComments();
  } catch (err) {
    console.error("Erreur lors de la suppression du commentaire:", err);
  }
}

// Fix the deleteArtwork function to include error handling
async function deleteArtwork(artworkId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce titre ?")) return;

  try {
    const response = await fetch(`/api/admin/artworks/${artworkId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      getArtworks();
      console.log("Titre supprimé avec succès");
    } else {
      const errorData = await response.json();
      console.error("Erreur lors de la suppression:", errorData);
      alert(
        `Erreur lors de la suppression: ${
          errorData.error || "Une erreur est survenue"
        }`
      );
    }
  } catch (err) {
    console.error("Erreur lors de la suppression du titre:", err);
    alert("Erreur lors de la suppression du titre");
  }
}

async function deleteList(listId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette liste ?")) return;

  try {
    const response = await fetch(`/api/admin/lists/${listId}`, {
      method: "DELETE",
    });
    if (response.ok) getLists();
  } catch (err) {
    console.error("Erreur lors de la suppression de la liste:", err);
  }
}

// Fonctions d'édition
async function editUser(userId) {
  try {
    console.log(`Requesting user data for ID: ${userId}`);
    const response = await fetch(`/api/admin/users/${userId}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Response error:", errorData);
      throw new Error(
        `Erreur lors de la récupération des données utilisateur: ${
          errorData.error || response.statusText
        }`
      );
    }

    const user = await response.json();
    console.log("User data received:", user);

    // Création d'une modale pour l'édition complète de l'utilisateur
    const modalHTML = `
      <div id="user-edit-modal" class="modal">
        <div class="modal-content">
          <h4>Modifier l'Utilisateur</h4>
          <form id="user-edit-form">
            <div class="form-group">
              <label for="username">Nom d'utilisateur</label>
              <input type="text" id="username" name="username" value="${
                user.Username
              }" required>
            </div>
            <div class="form-group">
              <label for="email">Adresse email</label>
              <input type="email" id="email" name="email" value="${
                user.EmailAddress
              }" required>
            </div>
            <div class="form-group">
              <label for="firstName">Prénom</label>
              <input type="text" id="firstName" name="firstName" value="${
                user.FirstName || ""
              }">
            </div>
            <div class="form-group">
              <label for="lastName">Nom</label>
              <input type="text" id="lastName" name="lastName" value="${
                user.LastName || ""
              }">
            </div>
            <div class="form-group">
              <label for="role">Rôle</label>
              <select id="role" name="role" required>
                <option value="1" ${
                  user.RoleID === 1 ? "selected" : ""
                }>Utilisateur</option>
                <option value="2" ${
                  user.RoleID === 2 ? "selected" : ""
                }>Administrateur</option>
              </select>
            </div>
            <div class="form-group">
              <label for="gender">Genre</label>
              <select id="gender" name="gender">
                <option value="" ${
                  user.Gender === null ? "selected" : ""
                }>Non spécifié</option>
                <option value="true" ${
                  user.Gender === true ? "selected" : ""
                }>Homme</option>
                <option value="false" ${
                  user.Gender === false ? "selected" : ""
                }>Femme</option>
              </select>
            </div>
            <div class="form-group">
              <label for="bio">Biographie</label>
              <textarea id="bio" name="bio">${user.Bio || ""}</textarea>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Mettre à jour</button>
              <button type="button" class="btn-secondary" onclick="document.getElementById('user-edit-modal').remove()">Annuler</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Ajouter la modale au DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const modal = document.getElementById("user-edit-modal");

    // Gestionnaire de soumission du formulaire
    document
      .getElementById("user-edit-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());

        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });

          if (response.ok) {
            modal.remove();
            getUsers();
          } else {
            const errorData = await response.json();
            alert(`Erreur: ${errorData.error || "Une erreur est survenue"}`);
          }
        } catch (err) {
          console.error("Erreur lors de la mise à jour de l'utilisateur:", err);
          alert("Erreur lors de la mise à jour de l'utilisateur");
        }
      });
  } catch (err) {
    console.error("Erreur lors de l'édition de l'utilisateur:", err);
    alert(err.message);
  }
}

async function editList(listId) {
  try {
    const response = await fetch(`/api/admin/lists/${listId}`);
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des données de la liste");

    const list = await response.json();

    // Création d'une modale simple pour modifier le nom de la liste
    const modalHTML = `
      <div id="list-edit-modal" class="modal">
        <div class="modal-content">
          <h4>Modifier la Liste</h4>
          <form id="list-edit-form">
            <div class="form-group">
              <input type="text" name="name" value="${list.ListName}" placeholder="Nom de la liste" required>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Mettre à jour</button>
              <button type="button" class="btn-secondary" onclick="document.getElementById('list-edit-modal').remove()">Annuler</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Ajouter la modale au DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const modal = document.getElementById("list-edit-modal");

    // Gestionnaire de soumission du formulaire
    document
      .getElementById("list-edit-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = e.target.querySelector('input[name="name"]').value;

        try {
          const response = await fetch(`/api/admin/lists/${listId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });

          if (response.ok) {
            modal.remove();
            getLists();
          }
        } catch (err) {
          console.error("Erreur lors de la mise à jour de la liste:", err);
        }
      });
  } catch (err) {
    console.error("Erreur lors de l'édition de la liste:", err);
  }
}

// Fix the editArtwork function to handle image paths correctly
async function editArtwork(artworkId) {
  try {
    const response = await fetch(`/api/admin/artworks/${artworkId}`);
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des données du titre");

    const artwork = await response.json();

    // Get the poster path without the TMDB prefix
    const posterPath = artwork.ArtworkPosterImage || "";

    // Création d'une modale simple pour modifier le titre
    const modalHTML = `
      <div id="artwork-edit-modal" class="modal">
        <div class="modal-content">
          <h4>Modifier le Titre</h4>
          <form id="artwork-edit-form">
            <div class="form-group">
              <input type="text" name="title" value="${
                artwork.ArtworkName
              }" placeholder="Titre" required>
            </div>
            <div class="form-group">
              <input type="text" name="posterUrl" value="${posterPath}" placeholder="Chemin de l'affiche" required>
            </div>
            <div class="form-group">
              <textarea name="description" placeholder="Description">${
                artwork.ArtworkAPILink || ""
              }</textarea>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Mettre à jour</button>
              <button type="button" class="btn-secondary" onclick="document.getElementById('artwork-edit-modal').remove()">Annuler</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Ajouter la modale au DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const modal = document.getElementById("artwork-edit-modal");

    // Gestionnaire de soumission du formulaire
    document
      .getElementById("artwork-edit-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const artworkData = Object.fromEntries(formData.entries());

        try {
          const response = await fetch(`/api/admin/artworks/${artworkId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(artworkData),
          });

          if (response.ok) {
            modal.remove();
            getArtworks();
          } else {
            const errorData = await response.json();
            alert(`Erreur: ${errorData.error || "Une erreur est survenue"}`);
          }
        } catch (err) {
          console.error("Erreur lors de la mise à jour du titre:", err);
          alert("Erreur lors de la mise à jour du titre");
        }
      });
  } catch (err) {
    console.error("Erreur lors de l'édition du titre:", err);
    alert("Erreur lors de la récupération des données du titre");
  }
}

// Gestion des modales
function toggleAddUserModal() {
  const modal = document.getElementById("user-modal");
  modal.hidden = !modal.hidden;
}

function closeUserModal() {
  document.getElementById("user-modal").hidden = true;
}

function toggleAddArtworkModal() {
  const modal = document.getElementById("artwork-modal");
  modal.hidden = !modal.hidden;
}

function closeArtworkModal() {
  document.getElementById("artwork-modal").hidden = true;
}

// Gestionnaires de recherche
document.getElementById("users-search").addEventListener(
  "input",
  debounce((e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterItems(".user-item", searchTerm);
  })
);

document.getElementById("comments-search").addEventListener(
  "input",
  debounce((e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterItems(".comment-item", searchTerm);
  })
);

document.getElementById("artworks-search").addEventListener(
  "input",
  debounce((e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterItems(".artwork-item", searchTerm);
  })
);

document.getElementById("lists-search").addEventListener(
  "input",
  debounce((e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterItems(".list-item", searchTerm);
  })
);

function filterItems(selector, searchTerm) {
  const items = document.querySelectorAll(selector);
  items.forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(searchTerm) ? "" : "none";
  });
}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

// Gestionnaires de formulaire
document.getElementById("user-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const userData = Object.fromEntries(formData.entries());
  const userId = e.target.dataset.userId;

  // Check if passwords match for new users
  if (!userId && userData.password !== userData.confirmPassword)
    return alert("Les mots de passe ne correspondent pas.");

  try {
    let url = "/api/admin/users";
    let method = "POST";

    // Si un userId est présent, il s'agit d'une mise à jour
    if (userId) {
      url = `/api/admin/users/${userId}`;
      method = "PUT";

      // Remove confirmPassword field for updates
      delete userData.confirmPassword;

      // If password is empty for an update, remove it from the data
      if (!userData.password) {
        delete userData.password;
      }
    } else {
      // For new users, validate all required fields
      const requiredFields = [
        "username",
        "firstName",
        "lastName",
        "email",
        "password",
        "confirmPassword",
        "birthdate",
        "securityQuestion",
        "securityAnswer",
        "role",
      ];

      for (const field of requiredFields)
        if (!userData[field])
          return alert(`Le champ "${field}" est obligatoire.`);
    }

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      closeUserModal();
      getUsers();
      e.target.reset();
      // Réinitialiser le formulaire pour une future création
      delete e.target.dataset.userId;
      e.target.querySelector('button[type="submit"]').textContent =
        "Sauvegarder";
    } else {
      const errorData = await response.json();
      alert(`Erreur: ${errorData.error || "Une erreur est survenue"}`);
    }
  } catch (err) {
    console.error("Erreur lors de l'opération sur l'utilisateur:", err);
    alert("Une erreur est survenue lors de l'opération sur l'utilisateur.");
  }
});

document
  .getElementById("artwork-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const artworkData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/admin/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(artworkData),
      });

      if (response.ok) {
        closeArtworkModal();
        getArtworks();
        e.target.reset();
      }
    } catch (err) {
      console.error("Erreur lors de la création du titre:", err);
    }
  });

// Gestion des onglets
document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Retirer la classe active de tous les boutons et contenus
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Ajouter la classe active au bouton cliqué
      button.classList.add("active");

      // Activer le contenu correspondant
      const tabId = button.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.add("active");

      // Recharger les données de l'onglet actif
      switch (tabId) {
        case "users":
          getUsers();
          break;
        case "comments":
          getComments();
          break;
        case "artworks":
          getArtworks();
          break;
        case "lists":
          getLists();
          break;
      }
    });
  });

  // Initialisation des données pour le premier onglet
  getUsers();

  // Event listeners pour la recherche
  document.getElementById("users-search").addEventListener(
    "input",
    debounce((e) => {
      filterItems(".user-item", e.target.value.toLowerCase());
    })
  );

  document.getElementById("comments-search").addEventListener(
    "input",
    debounce((e) => {
      filterItems(".comment-item", e.target.value.toLowerCase());
    })
  );

  document.getElementById("artworks-search").addEventListener(
    "input",
    debounce((e) => {
      filterItems(".artwork-item", e.target.value.toLowerCase());
    })
  );

  document.getElementById("lists-search").addEventListener(
    "input",
    debounce((e) => {
      filterItems(".list-item", e.target.value.toLowerCase());
    })
  );
});

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  // Initialisation des données
  getUsers();
  getComments();
  getArtworks();
  getLists();

  // Event listeners pour la recherche
  document.getElementById("users-search").addEventListener(
    "input",
    debounce((e) => {
      filterItems(".user-item", e.target.value.toLowerCase());
    })
  );

  document.getElementById("comments-search").addEventListener(
    "input",
    debounce((e) => {
      filterItems(".comment-item", e.target.value.toLowerCase());
    })
  );

  document.getElementById("artworks-search").addEventListener(
    "input",
    debounce((e) => {
      filterItems(".artwork-item", e.target.value.toLowerCase());
    })
  );

  document.getElementById("lists-search").addEventListener(
    "input",
    debounce((e) => {
      filterItems(".list-item", e.target.value.toLowerCase());
    })
  );
});
