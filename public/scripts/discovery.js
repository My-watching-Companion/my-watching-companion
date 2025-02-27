async function setWatchlistBackgrounds() {
    try {
        // Récupérer les artworks de l'utilisateur
        let artworks = await fetch("/api/getuserartworks");
        artworks = await artworks.json();

        // Sélectionner tous les éléments .container-affiche
        const containers = document.querySelectorAll('.container-affiche');

        containers.forEach((container, index) => {
            if (artworks[index]) {
                // Créer l'image
                const cardPoster = new Image();
                cardPoster.crossOrigin = "anonymous";
                cardPoster.src = `https://image.tmdb.org/t/p/w500${artworks[index].artwork_poster}`;
                
                // Quand l'image est chargée, l'appliquer comme fond
                cardPoster.onload = () => {
                    container.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${cardPoster.src})`;
                    container.style.backgroundSize = 'cover';
                    container.style.backgroundPosition = 'center';
                };
            }
        });
    } catch (error) {
        console.error("Erreur lors du chargement des images:", error);
    }
}

// Exécuter la fonction quand le DOM est chargé
document.addEventListener("DOMContentLoaded", setWatchlistBackgrounds);