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

// Carousel
document.addEventListener('DOMContentLoaded', () => {
  const carousels = document.querySelectorAll('.carousel-container');

  function calculateScrollDistance(containerWidth) {
    if (window.innerWidth <= 480) {
      return containerWidth * 0.5; // Défilement de 50% sur mobile
    } else if (window.innerWidth <= 768) {
      return containerWidth * 0.6; // Défilement de 60% sur tablette
    } else if (window.innerWidth <= 1200) {
      return containerWidth * 0.7; // Défilement de 70% sur petits écrans
    } else {
      return containerWidth * 0.8; // Défilement de 80% sur grands écrans
    }
  }

  carousels.forEach(carousel => {
    const content = carousel.querySelector('.bloc_TrendingMoviesByDay, .bloc_TrendingMoviesByWeek, .bloc_UpcomingMovies');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');

    // Force l'affichage permanent des boutons
    prevBtn.style.cssText = 'display: flex !important; opacity: 1 !important;';
    nextBtn.style.cssText = 'display: flex !important; opacity: 1 !important;';

    // Gestionnaire de clic pour le bouton suivant
    nextBtn.addEventListener('click', () => {
      const scrollDistance = calculateScrollDistance(content.clientWidth);
      content.scrollBy({
        left: scrollDistance,
        behavior: 'smooth'
      });
    });

    // Gestionnaire de clic pour le bouton précédent
    prevBtn.addEventListener('click', () => {
      const scrollDistance = calculateScrollDistance(content.clientWidth);
      content.scrollBy({
        left: -scrollDistance,
        behavior: 'smooth'
      });
    });

    // Recalculer la distance de défilement lors du redimensionnement
    window.addEventListener('resize', () => {
      // La distance sera recalculée au prochain clic
    });

    // Désactivation de la vérification du scroll qui pourrait cacher les boutons
    content.addEventListener('scroll', () => {
      prevBtn.style.cssText = 'display: flex !important; opacity: 1 !important;';
      nextBtn.style.cssText = 'display: flex !important; opacity: 1 !important;';
    });
  });
});

getTrendingMoviesByDay();
getTrendingMoviesByWeek();
getUpcomingMovies();

