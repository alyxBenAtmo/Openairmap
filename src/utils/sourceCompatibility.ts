import { sources } from "../constants/sources";
import { pasDeTemps } from "../constants/timeSteps";

/**
 * Vérifie si une source est compatible avec le pas de temps actuel
 */
export const isSourceCompatibleWithTimeStep = (
  sourceCode: string,
  timeStep: string
): boolean => {
  // Gérer les nouveaux groupes (microcapteursQualifies.atmoMicro -> atmoMicro)
  let actualSourceCode = sourceCode;
  let groupCode: string | null = null;
  
  if (sourceCode.includes(".")) {
    const parts = sourceCode.split(".");
    groupCode = parts[0];
    actualSourceCode = parts[1];
  }

  // Si c'est une source dans un groupe, chercher dans le groupe
  if (groupCode) {
    const group = sources[groupCode];
    if (group && group.isGroup && group.subSources) {
      const subSource = group.subSources[actualSourceCode];
      if (subSource && subSource.supportedTimeSteps) {
        return subSource.supportedTimeSteps.includes(timeStep);
      }
    }
    return false;
  }

  // Source principale (atmoRef)
  const source = sources[actualSourceCode];
  if (!source) {
    return false;
  }

  // Vérifier les pas de temps de la source principale
  if (source.supportedTimeSteps) {
    return source.supportedTimeSteps.includes(timeStep);
  }

  // Si c'est un groupe, vérifier les sous-sources
  if (source.isGroup && source.subSources) {
    // Pour un groupe, on vérifie si au moins une sous-source est compatible
    return Object.values(source.subSources).some(
      (subSource) =>
        subSource.supportedTimeSteps &&
        subSource.supportedTimeSteps.includes(timeStep)
    );
  }

  return true; // Par défaut, considérer comme compatible
};

/**
 * Obtient le nom d'affichage d'une source
 */
export const getSourceDisplayName = (sourceCode: string): string => {
  if (sourceCode === "atmoRef") return "Station de référence atmosud";
  
  // Si c'est le groupe microcapteursQualifies, retourner "NebuleAir"
  if (sourceCode === "microcapteursQualifies") {
    return "NebuleAir";
  }
  
  // Gérer les nouveaux groupes
  if (sourceCode.includes(".")) {
    const parts = sourceCode.split(".");
    const groupCode = parts[0];
    const subSourceCode = parts[1];
    
    // Si c'est une source du groupe microcapteursQualifies, retourner "NebuleAir"
    if (groupCode === "microcapteursQualifies") {
      return "NebuleAir";
    }
    
    const group = sources[groupCode];
    if (group && group.isGroup && group.subSources) {
      const subSource = group.subSources[subSourceCode];
      if (subSource) {
        return subSource.name;
      }
    }
  }
  
  // Sources principales (anciennes ou sans groupe)
  const source = sources[sourceCode];
  if (source && !source.isGroup) {
    return source.name;
  }
  
  return sourceCode;
};

/**
 * Obtient les pas de temps supportés par une source
 */
export const getSupportedTimeStepsForSource = (
  sourceCode: string
): string[] => {
  let actualSourceCode = sourceCode;
  let groupCode: string | null = null;
  
  if (sourceCode.includes(".")) {
    const parts = sourceCode.split(".");
    groupCode = parts[0];
    actualSourceCode = parts[1];
  }

  // Si c'est une source dans un groupe, chercher dans le groupe
  if (groupCode) {
    const group = sources[groupCode];
    if (group && group.isGroup && group.subSources) {
      const subSource = group.subSources[actualSourceCode];
      if (subSource && subSource.supportedTimeSteps) {
        return subSource.supportedTimeSteps;
      }
    }
    return [];
  }

  // Source principale
  const source = sources[actualSourceCode];
  if (!source) {
    return [];
  }

  if (source.supportedTimeSteps) {
    return source.supportedTimeSteps;
  }

  return [];
};

/**
 * Obtient les noms d'affichage des pas de temps supportés
 */
export const getSupportedTimeStepNames = (sourceCode: string): string[] => {
  const supportedSteps = getSupportedTimeStepsForSource(sourceCode);
  return supportedSteps.map((step) => pasDeTemps[step]?.name || step);
};

/**
 * Obtient le premier pas de temps compatible pour une source
 */
export const getFirstCompatibleTimeStep = (sourceCode: string): string | null => {
  const supportedSteps = getSupportedTimeStepsForSource(sourceCode);
  if (supportedSteps.length > 0) {
    return supportedSteps[0];
  }
  return null;
};



