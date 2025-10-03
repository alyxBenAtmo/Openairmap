import { useState, useEffect } from "react";
import {
  getConfigForDomain,
  DOMAIN_CONFIG,
  DomainConfig,
} from "../config/domainConfig";

export const useDomainConfig = (): DomainConfig => {
  const [config, setConfig] = useState<DomainConfig>(DOMAIN_CONFIG.default);

  useEffect(() => {
    const domain = window.location.hostname;
    const domainConfig = getConfigForDomain(domain);
    setConfig(domainConfig);
  }, []);

  return config;
};
