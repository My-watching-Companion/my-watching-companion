// API 
async function getTrendingMoviesByDay() {
  fetch('/api/artworks/trending/day')
    .then(res => res.json())
    .then(res => {
      const moviesByDayContainer = document.querySelector('.bloc_TrendingMoviesByDay');
      displayTrendingMovies(res, moviesByDayContainer);
    })
    .catch(err => console.error(err));
}

async function getTrendingMoviesByWeek() {
  fetch('/api/artworks/trending/week')
    .then(res => res.json())
    .then(res => {
      const moviesByWeekContainer = document.querySelector('.bloc_TrendingMoviesByWeek');
      displayTrendingMovies(res, moviesByWeekContainer);
    })
    .catch(err => console.error(err));
}

async function getUpcomingMovies() {
  fetch('/api/artworks/trending/upcoming')
    .then(res => res.json())
    .then(res => {
      const upcomingMoviesContainer = document.querySelector('.bloc_UpcomingMovies');
      displayTrendingMovies(res, upcomingMoviesContainer);
    })
    .catch(err => console.error(err));
}

async function getTrendingComments() {
  fetch('/api/comments/trending')
    .then(res => res.json())
    .then(comments => {
      const commentsContainer = document.querySelector('.bloc_comm_pop');
      displayTrendingComments(comments, commentsContainer);
    })
    .catch(err => console.error(err));
}

function displayTrendingMovies(movies, container) {
  container.innerHTML = '';
  movies.forEach(movie => {
    console.log(movie);
    const movieElement = document.createElement('div');
    movieElement.className = 'movie-item';

    movieElement.innerHTML = `
            <a href="/artwork/${movie.ArtworkID}">
                <img src="https://image.tmdb.org/t/p/w500${movie.ArtworkPosterImage}" 
                     alt="${movie.ArtworkName}" 
                     class="img_movie">
            </a>`;

    container.appendChild(movieElement);
  });
}

function displayTrendingComments(comments, container) {
  container.innerHTML = '';
  
  if (!comments || comments.length === 0) {
    const noCommentsElement = document.createElement('div');
    noCommentsElement.className = 'no-comments-message';
    noCommentsElement.textContent = "Il n'y a pas encore eu de commentaires cette semaine";
    container.appendChild(noCommentsElement);
    return;
  }

  comments.forEach(comment => {
    const commentElement = document.createElement('div');
    commentElement.className = 'div_com_pop';
    commentElement.dataset.commentId = comment.comment_id;

    commentElement.innerHTML = `
      <a href="/artwork/${comment.artwork_id}">
        <img src="https://image.tmdb.org/t/p/w500${comment.artwork_poster}" alt="${comment.artwork_name}" class="artwork_poster">
      </a>
      <div class="com_pop">
        <h3><strong>${comment.artwork_name}</strong></h3>
        <p class="user_comm_pop">
          <u>${comment.username}</u> 
          <img src="${comment.user_avatar_url}" alt="Avatar" class="user-avatar">
        </p>
        <p class="text_com_pop">${comment.comment_content}</p>
        <div class="comment-actions">
          <div class="${comment.user_id !== -1 ? 'like-container clickable' : 'like-container'}">
            <span class="count-value">${comment.comment_likes || 0}</span>
            <span class="material-symbols-rounded ${comment.user_reaction === true ? 'filled' : ''}">thumb_up</span>
          </div>
          <div class="${comment.user_id !== -1 ? 'dislike-container clickable' : 'dislike-container'}">
            <span class="count-value">${comment.comment_dislikes || 0}</span>
            <span class="material-symbols-rounded ${comment.user_reaction === false ? 'filled' : ''}">thumb_down</span>
          </div>
        </div>
      </div>
    `;

    // Ajout des event listeners pour les likes et dislikes
    if (comment.user_id !== -1) {
      const likeContainer = commentElement.querySelector('.like-container');
      const dislikeContainer = commentElement.querySelector('.dislike-container');
      const likeCount = likeContainer.querySelector('.count-value');
      const dislikeCount = dislikeContainer.querySelector('.count-value');
      const likeIcon = likeContainer.querySelector('.material-symbols-rounded');
      const dislikeIcon = dislikeContainer.querySelector('.material-symbols-rounded');

      likeContainer.onclick = async () => {
        const response = await fetch(`/api/comments/${comment.comment_id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).then(response => response.json());

        if (response.error) return console.error('Error liking comment:', response.error);

        if (response.removedReaction === true) {
          likeCount.textContent = parseInt(likeCount.textContent) - 1;
          likeIcon.classList.remove('filled');
        } else if (response.previousReaction === 'dislike') {
          dislikeCount.textContent = parseInt(dislikeCount.textContent) - 1;
          dislikeIcon.classList.remove('filled');
          
          likeCount.textContent = parseInt(likeCount.textContent) + 1;
          likeIcon.classList.add('filled');
        } else {
          likeCount.textContent = parseInt(likeCount.textContent) + 1;
          likeIcon.classList.add('filled');
        }
      };

      dislikeContainer.onclick = async () => {
        const response = await fetch(`/api/comments/${comment.comment_id}/dislike`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).then(response => response.json());

        if (response.error) return console.error('Error disliking comment:', response.error);

        if (response.removedReaction === true) {
          dislikeCount.textContent = parseInt(dislikeCount.textContent) - 1;
          dislikeIcon.classList.remove('filled');
        } else if (response.previousReaction === 'like') {
          likeCount.textContent = parseInt(likeCount.textContent) - 1;
          likeIcon.classList.remove('filled');
          
          dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1;
          dislikeIcon.classList.add('filled');
        } else {
          dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1;
          dislikeIcon.classList.add('filled');
        }
      };
    }

    container.appendChild(commentElement);
  });
}

// Carousel
document.addEventListener('DOMContentLoaded', () => {
  const carousels = document.querySelectorAll('.carousel-container');
  
  function calculateScrollDistance(containerWidth) {
    return Math.max(300, containerWidth * 0.8);
  }

  carousels.forEach(carousel => {
    const content = carousel.querySelector('.bloc_TrendingMoviesByDay, .bloc_TrendingMoviesByWeek, .bloc_UpcomingMovies, .bloc_comm_pop');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');

    if (!content || !prevBtn || !nextBtn) return;

    // Force l'affichage permanent des boutons
    prevBtn.style.cssText = 'display: flex !important; opacity: 1 !important;';
    nextBtn.style.cssText = 'display: flex !important; opacity: 1 !important;';

    prevBtn.addEventListener('click', () => {
      const scrollDistance = calculateScrollDistance(carousel.offsetWidth);
      content.scrollBy({
        left: -scrollDistance,
        behavior: 'smooth'
      });
    });

    nextBtn.addEventListener('click', () => {
      const scrollDistance = calculateScrollDistance(carousel.offsetWidth);
      content.scrollBy({
        left: scrollDistance,
        behavior: 'smooth'
      });
    });
  });
});

getTrendingMoviesByDay();
getTrendingMoviesByWeek();
getUpcomingMovies();
getTrendingComments();

