import React, { useState, useEffect } from 'react';
import { CreateNebuleAirContextComment } from '../../types';

interface AddContextCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: CreateNebuleAirContextComment) => Promise<void>;
  sensorId: string;
  dataStartDate?: string; // Date de début de la série affichée (ISO string)
  dataEndDate?: string; // Date de fin de la série affichée (ISO string)
}

const CONTEXT_TYPES = [
  { value: 'traffic', label: '🚗 Trafic', description: 'Trafic routier' },
  { value: 'fire', label: '🔥 Feu', description: 'Feu, brûlage' },
  { value: 'industrial', label: '🏭 Industriel', description: 'Activité industrielle' },
  { value: 'voisinage', label: '🏘️ Voisinage', description: 'Activité du voisinage' },
  { value: 'other', label: '📝 Autre', description: 'Autre contexte' },
];

const AddContextCommentModal: React.FC<AddContextCommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sensorId,
  dataStartDate,
  dataEndDate,
}) => {
  const [datetimeStart, setDatetimeStart] = useState<string>('');
  const [datetimeEnd, setDatetimeEnd] = useState<string>('');
  const [contextType, setContextType] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [user, setUser] = useState<string>('anonymous');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser les dates quand le modal s'ouvre avec les dates de la série affichée
  useEffect(() => {
    if (isOpen) {
      // Utiliser les dates de la série affichée, ou maintenant par défaut
      const start = dataStartDate ? new Date(dataStartDate) : new Date();
      const end = dataEndDate ? new Date(dataEndDate) : new Date();
      
      // Si on n'a pas de date de fin, ajouter 1 heure à la date de début
      if (!dataEndDate && dataStartDate) {
        end.setTime(start.getTime() + 60 * 60 * 1000); // +1 heure
      }

      // Convertir en ISO 8601 pour l'API (sans millisecondes)
      const formatDateForAPI = (date: Date): string => {
        return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
      };

      const startISO = formatDateForAPI(start);
      const endISO = formatDateForAPI(end);
      
      setDatetimeStart(startISO);
      setDatetimeEnd(endISO);
      setContextType('');
      setComments('');
      setError(null);
    }
  }, [isOpen, dataStartDate, dataEndDate]);

  // Formater la date pour l'input datetime-local (format: YYYY-MM-DDTHH:mm)
  // L'input datetime-local attend l'heure locale, donc on utilise getHours() et getMinutes()
  // qui retournent déjà l'heure locale après conversion automatique par JavaScript
  const formatForInput = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    
    // Utiliser les méthodes locales pour obtenir l'heure locale
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convertir depuis datetime-local vers ISO 8601
  const parseFromInput = (inputValue: string): string => {
    if (!inputValue) return '';
    // datetime-local retourne une date en heure locale, on doit la convertir en ISO
    const localDate = new Date(inputValue);
    return localDate.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!datetimeStart || !datetimeEnd) {
      setError('Les dates de début et de fin sont requises');
      return;
    }

    const startDate = new Date(datetimeStart);
    const endDate = new Date(datetimeEnd);

    if (endDate <= startDate) {
      setError('La date de fin doit être postérieure à la date de début');
      return;
    }

    setIsSubmitting(true);

    try {
      // Formater les dates au format ISO 8601 sans millisecondes et sans Z
      // L'API convertira vers UTC si timezone est fourni
      const formatDateForAPI = (date: Date): string => {
        // Formater en ISO sans Z (l'API ajoutera le timezone si nécessaire)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      // Détecter la timezone du navigateur
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const comment: CreateNebuleAirContextComment = {
        capteur_id: sensorId,
        datetime_start: formatDateForAPI(startDate),
        datetime_end: formatDateForAPI(endDate),
        timezone: timezone, // Envoyer la timezone pour que l'API convertisse vers UTC
        ...(contextType && { context_type: contextType }),
        ...(comments.trim() && { comments: comments.trim() }),
        ...(user.trim() && { user: user.trim() }),
      };

      await onSubmit(comment);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création du commentaire'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            Ajouter un commentaire de contexte
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Message informatif */}
          {(dataStartDate || dataEndDate) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start space-x-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-blue-800">
                  Les dates ont été pré-remplies avec la période affichée sur le graphique. 
                  Vous pouvez les ajuster selon vos besoins.
                </p>
              </div>
            </div>
          )}

          {/* Capteur ID (affiché en lecture seule) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capteur
            </label>
            <input
              type="text"
              value={sensorId}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Date de début */}
          <div>
            <label
              htmlFor="datetime-start"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date et heure de début <span className="text-red-500">*</span>
            </label>
            <input
              id="datetime-start"
              type="datetime-local"
              value={datetimeStart ? formatForInput(datetimeStart) : ''}
              onChange={(e) => setDatetimeStart(parseFromInput(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date de fin */}
          <div>
            <label
              htmlFor="datetime-end"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date et heure de fin <span className="text-red-500">*</span>
            </label>
            <input
              id="datetime-end"
              type="datetime-local"
              value={datetimeEnd ? formatForInput(datetimeEnd) : ''}
              onChange={(e) => setDatetimeEnd(parseFromInput(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type de contexte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de contexte (optionnel)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONTEXT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setContextType(
                      contextType === type.value ? '' : type.value
                    )
                  }
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    contextType === type.value
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-gray-500">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Commentaires */}
          <div>
            <label
              htmlFor="comments"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Commentaire (optionnel)
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Décrivez le contexte..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Utilisateur */}
          <div>
            <label
              htmlFor="user"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Utilisateur (optionnel)
            </label>
            <input
              id="user"
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="anonymous"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Création...' : 'Créer le commentaire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContextCommentModal;
