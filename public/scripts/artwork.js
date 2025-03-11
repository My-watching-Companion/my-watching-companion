async function loadComments() {
  const response = await fetch("/api/comments/artworks/" + artworkID);
  const comments = await response.json();
  const commentsContainer = document.getElementById("comments-list");

  // Clear existing comments
  commentsContainer.innerHTML = "";

  if (comments.length === 0) {
    const noCommentsDiv = document.createElement("div");
    noCommentsDiv.className = "no-comments";
    noCommentsDiv.textContent =
      "Pas encore de commentaires. Soyez le premier à partager votre avis !";
    commentsContainer.appendChild(noCommentsDiv);
    return;
  }

  comments.forEach((comment) => {
    const commentElement = document.createElement("div");
    commentElement.className = "comment-item";

    // Create comment header
    const commentHeader = document.createElement("div");
    commentHeader.className = "comment-header";

    // Comment user
    const commentUser = document.createElement("div");
    commentUser.className = "comment-user";

    const userAvatar = document.createElement("img");
    userAvatar.src = comment.user_avatar_url;
    userAvatar.alt = comment.username;
    userAvatar.className = "user-avatar";

    const username = document.createElement("h4");
    username.className = "username";
    username.textContent = "@" + comment.username;

    commentUser.appendChild(userAvatar);
    commentUser.appendChild(username);

    // Comment date section
    const commentDate = document.createElement("span");
    commentDate.className = "comment-date";
    commentDate.textContent = formatCommentDate(
      comment.created_at || new Date()
    );

    // Add user section and date to header
    commentHeader.appendChild(commentUser);
    commentHeader.appendChild(commentDate);

    // Create comment content
    const commentContent = document.createElement("div");
    commentContent.className = "comment-content";
    const commentText = document.createElement("p");
    commentText.textContent = comment.comment;
    commentContent.appendChild(commentText);

    // Create comment actions
    const commentActions = document.createElement("div");
    commentActions.className = "comment-actions";

    // Like Button
    const likeButton = document.createElement("button");
    likeButton.className = "comment-like";

    const thumbIcon = document.createElement("span");
    thumbIcon.className = "material-symbols-rounded";
    thumbIcon.textContent = "thumb_up";

    // TODO: Like Counter functionality !
    const likeCount = document.createElement("span");
    likeCount.className = "like-count";
    likeCount.textContent = comment.likes || 0;

    likeButton.appendChild(thumbIcon);
    likeButton.appendChild(likeCount);

    // Delete Button
    const deleteButton = document.createElement("button");
    deleteButton.className = "comment-delete";

    const binIcon = document.createElement("span");
    binIcon.className = "material-symbols-rounded";
    binIcon.textContent = "delete";

    deleteButton.appendChild(binIcon);

    deleteButton.onclick = async () => {
      const response = await fetch("/api/comments/" + comment.id, {
        method: "DELETE",
      }).then((response) => response.json());

      console.log(response);

      if (response.message) loadComments();
    };

    // Add buttons to actions
    if (userID !== -1) commentActions.appendChild(likeButton);
    if (userID === comment.user_id) commentActions.appendChild(deleteButton);

    // Add components to comment
    commentElement.appendChild(commentHeader);
    commentElement.appendChild(commentContent);
    commentElement.appendChild(commentActions);

    // Add comment to comments list
    commentsContainer.appendChild(commentElement);
  });
}

// Helper function to format comment dates
function formatCommentDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  else if (diffDays === 1) return "Hier";
  else if (diffDays < 7) return `Il y a ${diffDays} jours`;
  else return date.toLocaleDateString("fr-FR");
}

loadComments();

// Comment form
function updateCharacterCounter(element) {
  const currentCount = document.getElementById("current-count");
  const currentLength = element.value.length;
  currentCount.textContent = currentLength;

  if (currentLength >= 400) currentCount.style.color = "#f7384a";
  else currentCount.style.color = "#777";

  if (currentLength === 500) element.classList.add("apply-shake");
}

const commentInput = document.getElementById("comment-input");
if (commentInput)
  commentInput.addEventListener("animationend", () => {
    commentInput.classList.remove("apply-shake");
  });

async function sendComment(event) {
  event.preventDefault();
  const comment = commentInput.value;

  const response = await fetch("/api/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      artworkID,
      comment,
    }),
  }).then((response) => response.json());

  if (response.message) loadComments();
}
