async function ToggleAddFriends() {
    const addFriendsModal = document.getElementById("seefriendsblock");
    addFriendsModal.toggleAttribute("hidden");

    const addFriendsContainer = document.getElementById("addfriendsblock");

    addFriendsModal.onclick = (event) => {
        if (!addFriendsContainer.contains(event.target)) {
            addFriendsModal.toggleAttribute("hidden");
        }
    }
}

document.getElementById('friends-tab').addEventListener('keyup', function(e) {
    var recherche = this.value.toLowerCase();
    var documents = document.querySelectorAll('.friends');
   
    Array.prototype.forEach.call(documents, function(document) {
      // On a bien trouvé les termes de recherche.
      if (document.innerHTML.toLowerCase().indexOf(recherche) > -1) {
        document.style.display = 'flex';
      } else {
        document.style.display = 'none';
      }
    });
  });

document.getElementById('adding-friends').addEventListener('keyup', function(e) {
var recherche = this.value.toLowerCase();
var documents = document.querySelectorAll('.userslist');

Array.prototype.forEach.call(documents, function(document) {
    // On a bien trouvé les termes de recherche.
    if (document.innerHTML.toLowerCase().indexOf(recherche) > -1) {
    document.style.display = 'flex';
    } else {
    document.style.display = 'none';
    }
});
});

var enabled = false

function SeeAddFriends() {
    const div = document.getElementById("AddingFriendsList");
    if (!enabled) {
        div.classList.add("active");
        enabled = true;
    } else {
        div.classList.remove("active"); 
        enabled = false;
    }
}