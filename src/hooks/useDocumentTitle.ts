import { useEffect } from 'react';

/**
 * Hook personnalisé pour gérer le titre de la page de manière dynamique
 * @param title - Titre à afficher dans l'onglet du navigateur
 */
export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);
};
