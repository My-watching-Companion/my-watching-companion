// Modals and custom selects
async function toggleDeleteCommentModal(comment = null) {
  const deleteCommentModal = document.getElementById("delete-comment");
  deleteCommentModal.toggleAttribute("hidden");

  const addListContainer = document.getElementById("delete-comment-container");
  const previewContainer = document.getElementById(
    "comment-to-delete-container"
  );

  previewContainer.innerHTML = "";

  // If a comment is provided, populate the preview
  if (comment) {
    addListContainer.dataset.commentId = comment.comment_id;

    // Create preview of the comment to be deleted
    const commentPreview = document.createElement("div");
    commentPreview.className = "comment-preview";

    const commentContent = document.createElement("p");
    commentContent.textContent = comment.comment_content;

    commentPreview.appendChild(commentContent);
    previewContainer.appendChild(commentPreview);

    // Set up delete and cancel buttons
    const deleteButton = addListContainer.querySelector(".btn-primary");
    const cancelButton = addListContainer.querySelector(
      "button:not(.btn-primary)"
    );

    deleteButton.onclick = async () => {
      const resultBox = document.getElementById("result-box");

      const response = await fetch("/api/comments/" + comment.comment_id, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }).then((response) => response.json());

      if (response.error) {
        resultBox.textContent = "Ce commentaire ne peut pas être supprimé.";
        resultBox.classList.remove("invisible", "success");
        resultBox.classList.add("error");
        return;
      }

      if (response.message) {
        resultBox.textContent = "Commentaire supprimé avec succès!";
        resultBox.classList.remove("invisible", "error");
        resultBox.classList.add("success");

        // Close modal and reload comments after a short delay
        setTimeout(() => {
          toggleDeleteCommentModal();
          loadComments();
        }, 1500);
      }
    };

    cancelButton.onclick = () => toggleDeleteCommentModal();
  }

  const resultBox = document.getElementById("result-box");
  resultBox.classList.remove("error", "success");
  resultBox.classList.add("invisible");

  deleteCommentModal.onclick = (event) => {
    if (!addListContainer.contains(event.target)) toggleDeleteCommentModal();
  };
}

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
    commentElement.dataset.commentId = comment.comment_id;

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
    let dateText = formatCommentDate(comment.comment_creation || new Date());
    if (comment.comment_updated) dateText += " (modifié)";

    commentDate.textContent = dateText;

    // Add user section and date to header
    commentHeader.appendChild(commentUser);
    commentHeader.appendChild(commentDate);

    // Create comment content
    const commentContent = document.createElement("div");
    commentContent.className = "comment-content";
    const commentText = document.createElement("p");
    commentText.textContent = comment.comment_content;
    commentContent.appendChild(commentText);

    // Create comment actions
    const commentActions = document.createElement("div");
    commentActions.className = "comment-actions";

    // Likes
    const likeContainer = document.createElement("div");
    likeContainer.className =
      userID !== -1 ? "like-container clickable" : "like-container";

    const likeCount = document.createElement("span");
    likeCount.className = "count-value";
    likeCount.textContent = comment.comment_likes || 0;

    const likeIcon = document.createElement("span");
    likeIcon.classList.add(
      "material-symbols-rounded",
      ...(comment.user_reaction === true ? ["filled"] : [])
    );
    likeIcon.textContent = "thumb_up";

    likeContainer.appendChild(likeCount);
    likeContainer.appendChild(likeIcon);

    // Dislikes
    const dislikeContainer = document.createElement("div");
    dislikeContainer.className =
      userID !== -1 ? "dislike-container clickable" : "dislike-container";

    const dislikeCount = document.createElement("span");
    dislikeCount.className = "count-value";
    dislikeCount.textContent = comment.comment_dislikes || 0;

    const dislikeIcon = document.createElement("span");
    dislikeIcon.classList.add(
      "material-symbols-rounded",
      ...(comment.user_reaction === false ? ["filled"] : [])
    );
    dislikeIcon.textContent = "thumb_down";

    dislikeContainer.appendChild(dislikeCount);
    dislikeContainer.appendChild(dislikeIcon);

    // Add event listeners only if user is logged in
    if (userID !== -1) {
      likeContainer.onclick = async () => {
        const response = await fetch(
          `/api/comments/${comment.comment_id}/like`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        ).then((response) => response.json());

        if (response.error)
          return console.error("Error liking comment:", response.error);

        if (response.removedReaction === true) {
          likeCount.textContent = parseInt(likeCount.textContent) - 1;
          likeIcon.classList.remove("filled");
        } else if (response.previousReaction === "dislike") {
          dislikeCount.textContent = parseInt(dislikeCount.textContent) - 1;
          dislikeIcon.classList.remove("filled");

          likeCount.textContent = parseInt(likeCount.textContent) + 1;
          likeIcon.classList.add("filled");
        } else {
          likeCount.textContent = parseInt(likeCount.textContent) + 1;
          likeIcon.classList.add("filled");
        }
      };

      dislikeContainer.onclick = async () => {
        const response = await fetch(
          `/api/comments/${comment.comment_id}/dislike`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        ).then((response) => response.json());

        if (response.error)
          return console.error("Error disliking comment:", response.error);

        if (response.removedReaction === true) {
          dislikeCount.textContent = parseInt(dislikeCount.textContent) - 1;
          dislikeIcon.classList.remove("filled");
        } else if (response.previousReaction === "like") {
          likeCount.textContent = parseInt(likeCount.textContent) - 1;
          likeIcon.classList.remove("filled");

          dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1;
          dislikeIcon.classList.add("filled");
        } else {
          dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1;
          dislikeIcon.classList.add("filled");
        }
      };
    }

    commentActions.appendChild(likeContainer);
    commentActions.appendChild(dislikeContainer);

    // Edit and Delete Buttons (only visible for user comments)
    if (userID !== -1 && userID === comment.user_id) {
      // Edit Button
      const editButton = document.createElement("button");
      editButton.className = "comment-edit";

      const editIcon = document.createElement("span");
      editIcon.className = "material-symbols-rounded";
      editIcon.textContent = "edit";

      editButton.appendChild(editIcon);

      editButton.onclick = () => {
        enableCommentEditing(commentElement, comment.comment_content);
      };

      // Delete Button
      const deleteButton = document.createElement("button");
      deleteButton.className = "comment-delete";

      const binIcon = document.createElement("span");
      binIcon.className = "material-symbols-rounded";
      binIcon.textContent = "delete";

      deleteButton.appendChild(binIcon);

      deleteButton.onclick = () => {
        toggleDeleteCommentModal({
          comment_id: comment.comment_id,
          comment_content: comment.comment_content,
        });
      };

      commentActions.appendChild(editButton);
      commentActions.appendChild(deleteButton);
    }

    // Add components to comment
    commentElement.appendChild(commentHeader);
    commentElement.appendChild(commentContent);
    commentElement.appendChild(commentActions);

    // Add comment to comments list
    commentsContainer.appendChild(commentElement);
  });
}

// Function to enable comment editing
function enableCommentEditing(commentElement, currentContent) {
  const commentId = commentElement.dataset.commentId;
  const commentContent = commentElement.querySelector(".comment-content");

  // Create edit form
  const editForm = document.createElement("div");
  editForm.className = "edit-comment-form";

  // Create textarea with current comment content
  const textarea = document.createElement("textarea");
  textarea.value = currentContent;
  textarea.maxLength = 500;
  textarea.className = "edit-comment-input";
  textarea.oninput = function () {
    updateCharacterCounter(this, "edit-current-count");
  };

  // Character counter
  const charCounter = document.createElement("div");
  charCounter.className = "character-count edit-character-count";
  charCounter.innerHTML = `<span id="edit-current-count">${currentContent.length}</span>/500`;

  // Action buttons
  const actionButtons = document.createElement("div");
  actionButtons.className = "edit-actions";

  const saveButton = document.createElement("button");
  saveButton.className = "btn btn-primary";
  saveButton.innerHTML =
    '<span class="material-symbols-rounded">check</span> Enregistrer';

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-secondary";
  cancelButton.innerHTML =
    '<span class="material-symbols-rounded">close</span> Annuler';

  actionButtons.appendChild(saveButton);
  actionButtons.appendChild(cancelButton);

  // Add components to edit form
  editForm.appendChild(textarea);
  editForm.appendChild(charCounter);
  editForm.appendChild(actionButtons);

  // Replace content with edit form
  commentContent.innerHTML = "";
  commentContent.appendChild(editForm);

  // Text area functionality
  updateCharacterCounter(textarea, "edit-current-count");
  setupAnimationListeners(textarea);

  textarea.focus();

  // Save button action
  saveButton.onclick = async () => {
    const updatedContent = textarea.value.trim();

    if (updatedContent === "") return;

    const response = await fetch(`/api/comments/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: updatedContent }),
    }).then((response) => response.json());

    if (response.error) return;

    // Update the comment content
    commentContent.innerHTML = "";
    const commentText = document.createElement("p");
    commentText.textContent = updatedContent;
    commentContent.appendChild(commentText);

    // Update the date to show that the comment was modified
    const commentHeader = commentElement.querySelector(".comment-header");
    const dateSpan = commentHeader.querySelector(".comment-date");
    if (dateSpan && !dateSpan.textContent.includes("(modifié)"))
      dateSpan.textContent += " (modifié)";
  };

  // Cancel button action
  cancelButton.onclick = () => {
    commentContent.innerHTML = "";
    const commentText = document.createElement("p");
    commentText.textContent = currentContent;
    commentContent.appendChild(commentText);
  };
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

// Unified character counter function that works for both new comments and editing
function updateCharacterCounter(element, counterId = "current-count") {
  const currentCount = document.getElementById(counterId);
  const currentLength = element.value.length;
  currentCount.textContent = currentLength;

  // Change counter color/shake based on content
  if (currentLength >= 400) currentCount.style.color = "#f7384a";
  else currentCount.style.color = "#777";
  if (currentLength === 500) element.classList.add("apply-shake");

  // Auto-resize textarea based on content
  element.style.height = "auto";
  element.style.height = `calc(${element.scrollHeight}px - ${
    counterId.includes("edit") ? "1rem" : "2rem"
  })`;
}

// Setup animation end listeners for elements
function setupAnimationListeners(element) {
  element.addEventListener("animationend", () => {
    element.classList.remove("apply-shake");
  });
}

const commentInput = document.getElementById("comment-input");
if (commentInput) {
  setupAnimationListeners(commentInput);
}

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

  if (response.message) {
    loadComments();

    // Reset textarea content and height after submission
    commentInput.value = "";
    updateCharacterCounter(commentInput);
  }
}
