/// CONFIDENTIALITY SETTINGS

async function ChangeConf(event, user){
    const response = await fetch(`http://localhost:3000/api/modifyconfidentiality/${event.target.value}/${user}`)
} 

/// FRIENDS SETTINGS

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

async function GetUserConfidentiality(user) {
  const response = await fetch(`http://localhost:3000/api/getconfidentiality/${user}`).then((resp)=>resp.json())
  return response.confidentiality
  
}

function ModifyBio(){
  const newbio = document.getElementById('bio').value
  fetch(`http://localhost:3000/api/modifybio`, {headers:{"Content-Type": "application/json",}, body: JSON.stringify({newbio}), method: 'POST'})
  alert("La Bio a été changé avec Succès")
}

function ModifyGender(){
  const newgender = document.getElementById('gender').value
  fetch(`http://localhost:3000/api/modifygender/${newgender}`)
  alert("Le Genre a été changé avec Succès")
}