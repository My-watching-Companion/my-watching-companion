// Gestion des utilisateurs
async function getUsers() {
  try {
    const response = await fetch('/api/admin/users');
    const users = await response.json();
    displayUsers(users);
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs:', err);
  }
}

function displayUsers(users) {
  const container = document.querySelector('.users-list');
  container.innerHTML = '';

  users.forEach(user => {
    const userElement = document.createElement('div');
    userElement.className = 'admin-item user-item';
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
    const response = await fetch('/api/admin/comments');
    const comments = await response.json();
    displayComments(comments);
  } catch (err) {
    console.error('Erreur lors de la récupération des commentaires:', err);
  }
}

function displayComments(comments) {
  const container = document.querySelector('.comments-list');
  container.innerHTML = '';

  comments.forEach(comment => {
    const commentElement = document.createElement('div');
    commentElement.className = 'admin-item comment-item';
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
    const response = await fetch('/api/admin/artworks');
    const artworks = await response.json();
    displayArtworks(artworks);
  } catch (err) {
    console.error('Erreur lors de la récupération des titres:', err);
  }
}

function displayArtworks(artworks) {
  const container = document.querySelector('.artworks-list');
  container.innerHTML = '';

  artworks.forEach(artwork => {
    const artworkElement = document.createElement('div');
    artworkElement.className = 'admin-item artwork-item';
    artworkElement.innerHTML = `
      <div class="item-info">
        <img src="https://image.tmdb.org/t/p/w200${artwork.ArtworkPosterImage}" alt="${artwork.ArtworkName}" class="artwork-poster">
        <div class="artwork-details">
          <h4>${artwork.ArtworkName}</h4>
        </div>
      </div>
      <div class="item-actions">
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
    const response = await fetch('/api/admin/lists');
    const lists = await response.json();
    displayLists(lists);
  } catch (err) {
    console.error('Erreur lors de la récupération des listes:', err);
  }
}

function displayLists(lists) {
  const container = document.querySelector('.lists-list');
  container.innerHTML = '';

  lists.forEach(list => {
    const listElement = document.createElement('div');
    listElement.className = 'admin-item list-item';
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
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
  
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      getUsers();
    }
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', err);
  }
}

async function deleteComment(commentId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;
  
  try {
    const response = await fetch(`/api/admin/comments/${commentId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      getComments();
    }
  } catch (err) {
    console.error('Erreur lors de la suppression du commentaire:', err);
  }
}

async function deleteArtwork(artworkId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce titre ?')) return;
  
  try {
    const response = await fetch(`/api/admin/artworks/${artworkId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      getArtworks();
    }
  } catch (err) {
    console.error('Erreur lors de la suppression du titre:', err);
  }
}

async function deleteList(listId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) return;
  
  try {
    const response = await fetch(`/api/admin/lists/${listId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      getLists();
    }
  } catch (err) {
    console.error('Erreur lors de la suppression de la liste:', err);
  }
}

// Gestion des modales
function toggleAddUserModal() {
  const modal = document.getElementById('user-modal');
  modal.hidden = !modal.hidden;
}

function closeUserModal() {
  document.getElementById('user-modal').hidden = true;
}

function toggleAddArtworkModal() {
  const modal = document.getElementById('artwork-modal');
  modal.hidden = !modal.hidden;
}

function closeArtworkModal() {
  document.getElementById('artwork-modal').hidden = true;
}

// Gestionnaires de recherche
document.getElementById('users-search').addEventListener('input', debounce((e) => {
  const searchTerm = e.target.value.toLowerCase();
  filterItems('.user-item', searchTerm);
}));

document.getElementById('comments-search').addEventListener('input', debounce((e) => {
  const searchTerm = e.target.value.toLowerCase();
  filterItems('.comment-item', searchTerm);
}));

document.getElementById('artworks-search').addEventListener('input', debounce((e) => {
  const searchTerm = e.target.value.toLowerCase();
  filterItems('.artwork-item', searchTerm);
}));

document.getElementById('lists-search').addEventListener('input', debounce((e) => {
  const searchTerm = e.target.value.toLowerCase();
  filterItems('.list-item', searchTerm);
}));

function filterItems(selector, searchTerm) {
  const items = document.querySelectorAll(selector);
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(searchTerm) ? '' : 'none';
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
document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const userData = Object.fromEntries(formData.entries());
  
  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      closeUserModal();
      getUsers();
      e.target.reset();
    }
  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur:', err);
  }
});

document.getElementById('artwork-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const artworkData = Object.fromEntries(formData.entries());
  
  try {
    const response = await fetch('/api/admin/artworks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artworkData)
    });
    
    if (response.ok) {
      closeArtworkModal();
      getArtworks();
      e.target.reset();
    }
  } catch (err) {
    console.error('Erreur lors de la création du titre:', err);
  }
});

// Gestion des onglets
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Retirer la classe active de tous les boutons et contenus
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Ajouter la classe active au bouton cliqué
      button.classList.add('active');

      // Activer le contenu correspondant
      const tabId = button.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.add('active');

      // Recharger les données de l'onglet actif
      switch(tabId) {
        case 'users':
          getUsers();
          break;
        case 'comments':
          getComments();
          break;
        case 'artworks':
          getArtworks();
          break;
        case 'lists':
          getLists();
          break;
      }
    });
  });

  // Initialisation des données pour le premier onglet
  getUsers();

  // Event listeners pour la recherche
  document.getElementById('users-search').addEventListener('input', debounce((e) => {
    filterItems('.user-item', e.target.value.toLowerCase());
  }));

  document.getElementById('comments-search').addEventListener('input', debounce((e) => {
    filterItems('.comment-item', e.target.value.toLowerCase());
  }));

  document.getElementById('artworks-search').addEventListener('input', debounce((e) => {
    filterItems('.artwork-item', e.target.value.toLowerCase());
  }));

  document.getElementById('lists-search').addEventListener('input', debounce((e) => {
    filterItems('.list-item', e.target.value.toLowerCase());
  }));
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  // Initialisation des données
  getUsers();
  getComments();
  getArtworks();
  getLists();

  // Event listeners pour la recherche
  document.getElementById('users-search').addEventListener('input', debounce((e) => {
    filterItems('.user-item', e.target.value.toLowerCase());
  }));

  document.getElementById('comments-search').addEventListener('input', debounce((e) => {
    filterItems('.comment-item', e.target.value.toLowerCase());
  }));

  document.getElementById('artworks-search').addEventListener('input', debounce((e) => {
    filterItems('.artwork-item', e.target.value.toLowerCase());
  }));

  document.getElementById('lists-search').addEventListener('input', debounce((e) => {
    filterItems('.list-item', e.target.value.toLowerCase());
  }));
});