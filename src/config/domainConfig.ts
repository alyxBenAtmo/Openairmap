export interface DomainConfig {
  logo: string;
  logo2: string;
  mapCenter: [number, number];
  mapZoom: number;
  title: string;
  links: {
    website: string;
    contact: string;
    about?: string;
  };
  organization: string;
}

export const DOMAIN_CONFIG: Record<string, DomainConfig> = {
  default: {
    logo: "./logo_atmosud_inspirer_ok_web.png",
    logo2: "./LogoAirCarto.png",
    mapCenter: [43.7102, 7.262], // Nice
    mapZoom: 9,
    title: "OpenAirMap",
    links: {
      website: "https://atmosud.org",
      contact: "https://atmosud.org/contact",
      about: "https://atmosud.org/a-propos",
    },
    organization: "AtmoSud",
  },
};


export const getConfigForDomain = (domain: string): DomainConfig => {
  return DOMAIN_CONFIG[domain] || DOMAIN_CONFIG.default;
};
