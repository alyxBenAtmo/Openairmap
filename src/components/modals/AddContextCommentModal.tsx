import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreateNebuleAirContextComment } from '../../types';
import { cn } from '../../lib/utils';

interface AddContextCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: CreateNebuleAirContextComment) => Promise<void>;
  sensorId: string;
  dataStartDate?: string; // Date de début de la série affichée (ISO string)
  dataEndDate?: string; // Date de fin de la série affichée (ISO string)
}

/** Types de contexte pris en charge par l'API (context_type) */
const CONTEXT_TYPES = [
  { value: 'fire', label: '🔥 Feu', description: 'Incendie à proximité' },
  { value: 'industrial', label: '🏭 Industriel', description: 'Activité industrielle' },
  { value: 'traffic', label: '🚗 Trafic', description: 'Trafic routier' },
  { value: 'neighbourhood', label: '🏘️ Voisinage', description: 'Activité de voisinage' },
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
  const modalRef = useRef<HTMLDivElement>(null);

  // Fermeture au Escape
  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  // Focus initial sur le premier champ à l'ouverture
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const first = modalRef.current.querySelector<HTMLInputElement>('#datetime-start');
      first?.focus();
    }
  }, [isOpen]);

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
      setUser('anonymous');
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

  const inputBase =
    'w-full px-3 py-2 text-sm bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl ' +
    'placeholder:text-gray-400 text-gray-800 ' +
    'focus:outline-none focus:ring-2 focus:ring-[#4271B3]/20 focus:border-[#4271B3] focus:bg-white ' +
    'transition-all duration-200';

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
      onClick={handleClose}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-md rounded-2xl shadow-2xl',
          'bg-white/95 backdrop-blur-xl border border-gray-200/80',
          'transition-all duration-300'
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60 bg-gradient-to-r from-slate-50/80 to-transparent rounded-t-2xl">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-800">
            Ajouter un commentaire
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100/80 border border-gray-200/60 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4271B3]/20"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {(dataStartDate || dataEndDate) && (
            <p className="text-sm text-blue-700/90 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-xl px-3 py-2.5">
              Dates pré-remplies avec la période du graphique. Ajustez si besoin.
            </p>
          )}

          {/* Capteur et utilisateur */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide shrink-0">Capteur</span>
              <span className="text-sm text-slate-700 truncate font-medium">{sensorId}</span>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="user" className="text-xs font-medium text-slate-500 uppercase tracking-wide shrink-0">
                Utilisateur
              </label>
              <input
                id="user"
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="anonymous"
                className={cn(inputBase, 'min-w-0 max-w-36')}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="datetime-start" className="block text-xs font-medium text-slate-600 mb-1.5">
                Début <span className="text-red-500">*</span>
              </label>
              <input
                id="datetime-start"
                type="datetime-local"
                value={datetimeStart ? formatForInput(datetimeStart) : ''}
                onChange={(e) => setDatetimeStart(parseFromInput(e.target.value))}
                required
                className={inputBase}
              />
            </div>
            <div>
              <label htmlFor="datetime-end" className="block text-xs font-medium text-slate-600 mb-1.5">
                Fin <span className="text-red-500">*</span>
              </label>
              <input
                id="datetime-end"
                type="datetime-local"
                value={datetimeEnd ? formatForInput(datetimeEnd) : ''}
                onChange={(e) => setDatetimeEnd(parseFromInput(e.target.value))}
                required
                className={inputBase}
              />
            </div>
          </div>

          {/* Type de contexte */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Type (optionnel)</label>
            <div className="flex flex-wrap gap-2">
              {CONTEXT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setContextType(contextType === type.value ? '' : type.value)}
                  title={type.description}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-xl border transition-all duration-200',
                    contextType === type.value
                      ? 'bg-[#4271B3]/10 border-[#4271B3]/50 text-[#4271B3] font-medium shadow-sm'
                      : 'bg-white/70 border-gray-200/60 text-gray-600 hover:bg-gray-50/80 hover:border-gray-300/60'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label htmlFor="comments" className="block text-xs font-medium text-slate-600 mb-1.5">
              Commentaire (optionnel)
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={2}
              placeholder="Décrivez le contexte..."
              className={cn(inputBase, 'resize-none')}
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/60">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl hover:bg-gray-50 hover:border-gray-300/60 focus:outline-none focus:ring-2 focus:ring-[#4271B3]/20 transition-all duration-200 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium text-white bg-[#4271B3] rounded-xl hover:bg-[#365a9a] shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#4271B3]/30 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContextCommentModal;
