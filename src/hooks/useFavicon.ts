import { useEffect } from 'react';

/**
 * Hook personnalisé pour gérer la favicon de manière dynamique
 * @param faviconPath - Chemin vers la favicon à utiliser
 */
export const useFavicon = (faviconPath: string) => {
  useEffect(() => {
    if (!faviconPath) return;

    // Trouver ou créer l'élément link pour la favicon
    let faviconLink =
      document.querySelector('link[rel="shortcut icon"]') ||
      document.querySelector('link[rel="icon"]');

    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.setAttribute('rel', 'shortcut icon');
      document.head.appendChild(faviconLink);
    }

    // Mettre à jour le href seulement si différent pour éviter les rechargements inutiles
    if (faviconLink.getAttribute('href') !== faviconPath) {
      faviconLink.setAttribute('href', faviconPath);
      faviconLink.setAttribute('type', 'image/x-icon');
    }
  }, [faviconPath]);
};
