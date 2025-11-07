import React from "react";
import { DomainConfig } from "../../config/domainConfig";
import {
  getDefaultLevel,
  getMarkerPath,
} from "../../utils";

type TimeStepStatus = "available" | "limited" | "unavailable";

interface TimeStepInfo {
  label: string;
  status: TimeStepStatus;
  note?: string;
}

interface DataProvider {
  label: string;
  href?: string;
}

type IconDescriptor =
  | { kind: "marker"; source: string }
  | { kind: "badge"; label: string };

interface DataSourceItem {
  id: string;
  title: string;
  category: string;
  icon: IconDescriptor;
  timeSteps: TimeStepInfo[];
  description: React.ReactNode;
  provider: DataProvider;
  highlights?: string[];
}

const DATA_SOURCES: DataSourceItem[] = [
  {
    id: "atmo-ref",
    title: "Stations de référence AtmoSud",
    category: "station de mesure",
    icon: { kind: "marker", source: "atmoRef" },
    timeSteps: [
      { label: "Scan", status: "available"},
      { label: "2 min", status: "unavailable" },
      { label: "QH", status: "available" },
      { label: "H", status: "available" },
      { label: "J", status: "available" },
    ],
    description:
      "Stations de référence installées dans le cadre de la mission de surveillance de la qualité de l'air d'AtmoSud.",
    provider: { label: "AtmoSud", href: "https://www.atmosud.org" },
  },
  {
    id: "atmo-micro",
    title: "Microcapteurs qualifiés AtmoSud",
    category: "microcapteur",
    icon: { kind: "marker", source: "atmoMicro" },
    timeSteps: [
      { label: "Scan", status: "available"},
      { label: "2 min", status: "available" },
      { label: "QH", status: "available" },
      { label: "H", status: "available" },
      { label: "J", status: "unavailable"},
    ],
    description: (
      <span className="inline-flex items-center gap-2">
        <span>
          Microcapteurs déployés par AtmoSud. Les données horaires sont consolidées
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          className="h-10 w-10 text-[#0074d9]"
          role="img"
          aria-label="Données consolidées"
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M8 0c-.69 0-1.406.148-2.09.424L2.64 1.93A1 1 0 0 0 2 2.91v4.212c0 2.707 1.657 5.437 4.97 7.135l.53.27.53-.27C12.343 12.56 14 9.83 14 7.122V2.91a1 1 0 0 0-.64-.98L10.09.424A5.373 5.373 0 0 0 8 0m3.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L8.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0"
          />
        </svg>
      </span>
    ),
    provider: { label: "AtmoSud", href: "https://www.atmosud.org" },
    highlights: ["NebuleAir", "Kunak", "Nexelec"],
  },
  {
    id: "nebuleair",
    title: "Capteurs NebuleAir",
    category: "microcapteur",
    icon: { kind: "marker", source: "nebuleair" },
    timeSteps: [
      { label: "Scan", status: "available"},
      { label: "2 min", status: "available" },
      { label: "QH", status: "available" },
      { label: "H", status: "available"},
      { label: "J", status: "available" },
    ],
    description:
      "Microcapteurs open source co-développés par AirCarto et AtmoSud.",
    provider: { label: "AirCarto", href: "https://aircarto.com" },
  },
  {
    id: "sensor-community",
    title: "Capteurs Sensor.Community",
    category: "microcapteur",
    icon: { kind: "marker", source: "sensorCommunity" },
    timeSteps: [
      { label: "Scan", status: "available"},
      { label: "2 min", status: "available" },
      { label: "QH", status: "unavailable" },
      { label: "H", status: "unavailable" },
      { label: "J", status: "unavailable" },
    ],
    description:
      "Microcapteurs open source fabriqués par des citoyens bénévoles.",
    provider: { label: "Sensor.Community", href: "https://sensor.community" },
  },
  {
    id: "purpleair",
    title: "Capteurs PurpleAir",
    category: "microcapteur",
    icon: { kind: "marker", source: "purpleair" },
    timeSteps: [
      { label: "Scan", status: "available"},
      { label: "2 min", status: "available"},
      { label: "QH", status: "unavailable" },
      { label: "H", status: "unavailable" },
      { label: "J", status: "unavailable" },
    ],
    description:
      "Microcapteurs commercialisés par l'entreprise américaine PurpleAir Inc.",
    provider: { label: "PurpleAir", href: "https://www.purpleair.com" },
  },
  {
    id: "modeling-pm",
    title: "Modélisation horaire par polluant AtmoSud",
    category: "modélisation",
    icon: { kind: "badge", label: "mod" },
    timeSteps: [
      { label: "Scan", status: "unavailable" },
      { label: "2 min", status: "unavailable" },
      { label: "QH", status: "available" },
      { label: "H", status: "available" },
      { label: "J", status: "unavailable" },
    ],
    description:
      "Modélisation des particules fines à l'échelle horaire sur toute la région PACA.",
    provider: { label: "AtmoSud", href: "https://www.atmosud.org" },
  },
  {
    id: "modeling-icaireh",
    title: "Modélisation horaire ICAIRH",
    category: "modélisation",
    icon: { kind: "badge", label: "mod" },
    timeSteps: [
      { label: "Scan", status: "unavailable" },
      { label: "2 min", status: "unavailable" },
      { label: "QH", status: "available" },
      { label: "H", status: "available" },
      { label: "J", status: "unavailable" },
    ],
    description:
      "Modélisation de l'indice cumulé de la qualité de l'air (NO2, O3, PM2.5 et PM10) à l'échelle horaire sur toute la région PACA.",
    provider: { label: "AtmoSud", href: "https://www.atmosud.org" },
  },
];

const STEP_STYLES: Record<TimeStepStatus, string> = {
  available: "bg-[#4271B3] text-white border-[#4271B3]",
  limited: "bg-amber-100 text-amber-700 border-amber-200",
  unavailable: "bg-[#E5E7EB] text-black border-gray-300",
};

interface InformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainConfig: DomainConfig;
}

const InformationModal: React.FC<InformationModalProps> = ({
  isOpen,
  onClose,
  domainConfig,
}) => {
  if (!isOpen) {
    return null;
  }

  const renderIcon = (icon: IconDescriptor) => {
    if (icon.kind === "marker") {
      const defaultLevel = "bon";
      const path = getMarkerPath(icon.source, defaultLevel);
      return (
        <img
          src={path}
          alt={`Icône ${icon.source}`}
          className="h-9 w-9 object-contain drop-shadow"
        />
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-700">
        {icon.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center overflow-y-auto bg-slate-900/40 backdrop-blur-sm px-3 py-4 sm:py-6">
      <div className="relative w-full max-w-5xl max-h-[85vh] md:max-h-[80vh]">
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-gray-200 p-1.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            aria-label="Fermer la fenêtre d'information"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-6 bg-gradient-to-br from-[#f4f8ff] via-white to-white px-6 pb-6 pt-8 sm:px-10">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-slate-800">
                Bienvenue sur OpenAirMap
              </h2>
              <p className="max-w-2xl text-sm text-slate-600">
                L'application OpenAirMap est un projet open source porté par AirCarto et
                AtmoSud pour afficher en temps réel les mesures de qualité de l'air
                effectué par les stations de mesures et les microcapteurs. Les informations
                affichées sur la carte sont récupérées via différentes plateforme de mise à
                disposition de données de mesure (API). A noter que cette application est en
                constante évolution et amélioration. Pour toutes questions et suggestions
                n'hésitez pas à déposer un message sur le GitHub du projet.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <img
                src={domainConfig.logo2}
                alt="Logo AirCarto"
                className="h-12 w-auto object-contain"
              />
              <img
                src={domainConfig.logo}
                alt={`Logo ${domainConfig.organization}`}
                className="h-12 w-auto object-contain"
              />
            </div>
          </header>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="px-6 pb-3 pt-5 sm:px-10">
              <h3 className="text-lg font-semibold text-slate-800">
                Liste des données proposées par OpenAirMap
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                A noter que pour certains appareils, la donnée n'est pas disponible pour tous les pas de temps (2 minutes, quart-horaire, horaire et journalier). Dans ce cas l'icône est grisée.
              </p>
            </div>
            <div className="grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div className="col-span-3">Type de mesure</div>
              <div className="col-span-1">Icône</div>
              <div className="col-span-4">Pas de temps</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1 text-center">Source</div>
            </div>
            <div className="divide-y divide-slate-100">
              {DATA_SOURCES.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 text-sm text-slate-700"
                >
                  <div className="col-span-12 flex flex-col gap-1 sm:col-span-3">
                    <span className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {item.category}
                    </span>
                    {item.highlights && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.highlights.map((highlight) => (
                          <span
                            key={highlight}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-6 flex items-center sm:col-span-1">
                    {renderIcon(item.icon)}
                  </div>
                  <div className="col-span-12 flex flex-wrap items-start gap-2 sm:col-span-4">
                    {item.timeSteps.map((step) => (
                      <div key={step.label} className="flex flex-col items-start">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STEP_STYLES[step.status]}`}
                        >
                          {step.label}
                        </span>
                        {step.note && (
                          <span className="mt-1 text-[11px] text-slate-500">
                            {step.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    <div className="text-sm leading-snug text-slate-600">
                      {item.description}
                    </div>
                  </div>
                  <div className="col-span-12 flex items-start justify-start sm:col-span-1 sm:justify-center">
                    {item.provider.href ? (
                      <a
                        href={item.provider.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-md bg-[#4271B3] px-1.5 py-0.5 text-[0.58rem] font-semibold leading-tight text-white shadow-sm transition hover:bg-[#325a96] whitespace-nowrap"
                      >
                        {item.provider.label}
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        {item.provider.label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-600 shadow-inner">
            <h3 className="text-base font-semibold text-slate-800">
              Comment profiter au mieux de ces données ?
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Combinez les stations de référence et la modélisation pour avoir une
                vision globale en temps réel et en prévisionnel.
              </li>
              <li>
                Activez les microcapteurs pour zoomer sur les conditions locales et
                détecter les variations rapides de qualité de l'air.
              </li>
              <li>
                Utilisez le mode historique pour comparer les épisodes passés et
                valider vos hypothèses.
              </li>
            </ul>
          </section>

            </div>
          </div>

          <footer className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-10">
              <span>
                OpenAirMap est en amélioration continue. Partagez vos retours via
                notre <a href="https://github.com/OpenAirMap/openairmap" className="text-[#4271B3] hover:underline">GitHub</a> ou contactez-nous depuis le site
                d'AtmoSud.
              </span>
              <button
                onClick={onClose}
                className="inline-flex items-center rounded-md bg-[#4271B3] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#325a96]"
              >
                Compris
              </button>
            </footer>
        </div>
      </div>
    </div>
  );
};

export default InformationModal;

