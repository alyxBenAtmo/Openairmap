import L from "leaflet";
import { QUALITY_COLORS } from "../../../constants/qualityColors";
import { getMarkerZIndex } from "../../../utils/markerPriority";
import { MeasurementDevice } from "../../../types";

/**
 * Types de formes de marqueurs
 */
type MarkerShape = "square" | "hexagon" | "circle";

/**
 * Obtient la forme de marqueur selon la source
 */
function getMarkerShape(source: string): MarkerShape {
  const shapeMap: Record<string, MarkerShape> = {
    atmoRef: "square",
    atmoMicro: "hexagon",
    nebuleair: "circle",
    sensorCommunity: "circle",
    purpleair: "circle",
  };

  return shapeMap[source] || "circle";
}

/**
 * Génère le chemin SVG pour une forme de marqueur
 */
function generateShapePath(type: MarkerShape, size: number): string {
  const center = size / 2;
  const radius = size / 2 - 2; // Légère marge pour le contour

  switch (type) {
    case "square": {
      // Carré avec coins légèrement arrondis
      const cornerRadius = 2;
      const halfSize = size / 2;
      return `M ${cornerRadius},0 L ${size - cornerRadius},0 Q ${size},0 ${size},${cornerRadius} L ${size},${size - cornerRadius} Q ${size},${size} ${size - cornerRadius},${size} L ${cornerRadius},${size} Q 0,${size} 0,${size - cornerRadius} L 0,${cornerRadius} Q 0,0 ${cornerRadius},0 Z`;
    }
    case "hexagon": {
      // Hexagone régulier
      const points: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6; // Rotation pour avoir un sommet en haut
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
      }
      return `M ${points.join(" L ")} Z`;
    }
    case "circle": {
      // Cercle
      return `M ${center},${center} m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`;
    }
    default:
      return "";
  }
}

/**
 * Génère le SVG de l'épingle séparément
 */
function generatePinSVG(size: number = 32): string {
  const anchorPinRadius = 2.5;
  const anchorPinHeight = 4;
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${anchorPinRadius}, ${size})">
        <!-- Cercle de l'épingle -->
        <circle 
          cx="0" 
          cy="${-anchorPinHeight - anchorPinRadius}" 
          r="${anchorPinRadius}" 
          fill="#000000" 
          stroke="#ffffff" 
          stroke-width="0.5"
        />
        <!-- Pointe de l'épingle pointant vers le bas -->
        <path 
          d="M ${-anchorPinRadius * 0.6},${-anchorPinHeight - anchorPinRadius} L 0,0 L ${anchorPinRadius * 0.6},${-anchorPinHeight - anchorPinRadius} Z" 
          fill="#000000" 
          stroke="#ffffff" 
          stroke-width="0.5"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  `.trim();
}

/**
 * Crée une icône Leaflet séparée pour l'épingle d'ancrage
 * Cette épingle sera rendue comme un marqueur séparé avec un zIndexOffset très bas
 * pour qu'elle passe en dessous de tous les autres marqueurs
 * L'épingle est positionnée exactement à la position lat/long (ancrage sur la pointe de l'aiguille)
 */
export function createPinIcon(): L.DivIcon {
  const anchorPinRadius = 2.5;
  const anchorPinHeight = 4;
  const size = 32;
  
  const pinSVG = generatePinSVG(size);
  
  const div = document.createElement("div");
  div.className = "marker-pin-container";
  div.innerHTML = pinSVG;
  div.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    position: relative;
    pointer-events: none;
  `;
  
  // Dans le SVG, le groupe est transformé par translate(anchorPinRadius, size)
  // La pointe de l'épingle (l'aiguille) est à (0, 0) dans ce système transformé
  // Donc la pointe absolue est à (anchorPinRadius, size) dans le système de coordonnées du SVG
  // L'ancrage doit être sur la pointe pour positionner exactement l'épingle à la position lat/long
  const pinPointX = anchorPinRadius;
  const pinPointY = size;
  
  return L.divIcon({
    html: div.outerHTML,
    className: "marker-pin-div",
    iconSize: [size, size],
    iconAnchor: [pinPointX, pinPointY], // Ancrage exact sur la pointe de l'aiguille
  });
}

/**
 * Génère le SVG du marqueur principal (sans l'épingle pour les carrés)
 */
function generateMarkerSVG(
  shape: MarkerShape,
  color: string,
  size: number = 32,
  hasCorrection: boolean = false
): string {
  const path = generateShapePath(shape, size);

  // Ajuster l'épaisseur du contour selon la forme
  const strokeWidth = shape === "square" ? "2.5" : "1.5";
  
  // Contour bleu pour les données corrigées
  const correctionStrokeWidth = hasCorrection ? "6" : "0";

  // Pour les carrés, on ne décalera PAS le carré dans le SVG
  // Le décalage sera fait via le positionnement du conteneur
  // Pour les autres formes, pas de décalage
  const squareOffsetX = 0; // Pas de décalage dans le SVG
  const squareOffsetY = 0; // Pas de décalage dans le SVG

  // ViewBox normal pour toutes les formes
  const viewBoxX = 0;
  const viewBoxY = 0;
  const viewBoxWidth = size;
  const viewBoxHeight = size;

  // Définir l'effet de brillance bleu si nécessaire
  const correctionFilter = hasCorrection ? `
    <defs>
      <filter id="correctionGlow-${shape}-${size}">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  ` : "";

  return `
    <svg width="${size}" height="${size}" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">
      ${correctionFilter}
      <!-- Forme principale du marqueur (sans épingle, l'épingle sera un marqueur séparé) -->
      <g transform="translate(${squareOffsetX}, ${squareOffsetY})">
        ${hasCorrection ? `
        <!-- Contour bleu extérieur pour les données corrigées -->
        <path 
          d="${path}" 
          fill="none" 
          stroke="rgb(40, 100, 180)" 
          stroke-width="${correctionStrokeWidth}"
          stroke-linejoin="round"
          stroke-linecap="round"
          filter="url(#correctionGlow-${shape}-${size})"
          opacity="0.95"
        />
        ` : ""}
        <!-- Forme principale -->
        <path 
          d="${path}" 
          fill="${color}" 
          ${hasCorrection ? '' : `stroke="#000000" stroke-width="${strokeWidth}"`}
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </g>
    </svg>
  `.trim();
}

/**
 * Obtient la couleur selon le niveau de qualité
 */
function getQualityColor(qualityLevel: string): string {
  return QUALITY_COLORS[qualityLevel as keyof typeof QUALITY_COLORS] || QUALITY_COLORS.default;
}

/**
 * Obtient la couleur du texte selon le niveau de qualité
 */
function getTextColor(qualityLevel: string): string {
  const textColors: Record<string, string> = {
    bon: "#000000",
    moyen: "#000000",
    degrade: "#000000",
    mauvais: "#000000",
    tresMauvais: "#F2F2F2",
    extrMauvais: "#F2F2F2",
    default: "#666666",
  };
  return textColors[qualityLevel] || "#000000";
}

/**
 * Calcule la taille du marqueur selon la forme et le niveau de qualité
 * Les tailles sont ajustées pour que toutes les formes paraissent de la même taille visuellement
 */
function getMarkerSize(shape: MarkerShape, qualityLevel: string): number {
  const isGrey = qualityLevel === "default" || qualityLevel === "noData";
  
  // Tailles de base pour les marqueurs avec données (pour paraître visuellement identiques)
  const baseSizes: Record<MarkerShape, number> = {
    square: 28,    // Carrés paraissent plus grands, donc on les réduit
    circle: 30,    // Ronds paraissent légèrement plus grands, donc on les réduit un peu
    hexagon: 34,   // Hexagones paraissent plus petits, donc on les agrandit
  };
  
  const baseSize = baseSizes[shape] || 32;
  
  // Marqueurs gris (pas de données) : 50% de la taille de base
  if (isGrey) {
    return Math.round(baseSize * 0.5);
  }
  
  return baseSize;
}

/**
 * Crée un DivIcon avec SVG inline pour un marqueur
 */
export function createSVGMarkerIcon(
  source: string,
  qualityLevel: string,
  value?: number,
  options?: {
    isSelected?: boolean;
    highlightColor?: string;
    loading?: boolean;
    hasCorrection?: boolean;
    device?: MeasurementDevice; // Device complet pour calculer la priorité
  }
): L.DivIcon {
  const shape = getMarkerShape(source);
  const color = getQualityColor(qualityLevel);
  
  // Calculer la taille du marqueur (ajustée selon la forme pour paraître visuellement identique)
  const markerSize = getMarkerSize(shape, qualityLevel);
  const zIndex = options?.device ? getMarkerZIndex(options.device) : 500;

  // Créer le conteneur principal
  // La taille initiale sera ajustée après le positionnement du marqueur
  const div = document.createElement("div");
  div.className = `custom-marker-container svg-marker ${source}`;
  
  // Taille initiale du conteneur (sera ajustée après)
  const initialContainerWidth = markerSize * 2;
  const initialContainerHeight = markerSize * 2;
  
  div.style.cssText = `
    width: ${initialContainerWidth}px;
    height: ${initialContainerHeight}px;
    position: relative;
    z-index: ${zIndex};
    filter: drop-shadow(3px 4px 6px rgba(0, 0, 0, 0.7));
    overflow: visible;
  `;

  // Générer le SVG du marqueur principal
  const markerSVG = generateMarkerSVG(shape, color, markerSize, options?.hasCorrection);
  
  // Décalage du marqueur par rapport à l'épingle (l'épingle est à la position exacte)
  // Le marqueur doit apparaître légèrement au-dessus et à droite de l'épingle
  const anchorPinRadius = 2.5;
  const anchorPinHeight = 4;
  const pinSVGSize = 32; // Taille du SVG de l'épingle (fixe)
  const gap = 2; // Léger gap entre l'épingle et le marqueur
  
  // Position de la pointe de l'épingle dans le SVG de l'épingle
  // Dans generatePinSVG, le groupe est transformé par translate(anchorPinRadius, pinSVGSize)
  // La pointe est à (0, 0) dans ce système transformé, donc absolument à :
  const pinPointX = anchorPinRadius;
  const pinPointY = pinSVGSize;
  
  // Position du centre du cercle de l'épingle (pour calculer le décalage du marqueur)
  // Le cercle est à cy="${-anchorPinHeight - anchorPinRadius}" dans le groupe transformé
  // Donc la position absolue du centre du cercle est :
  const pinCircleCenterX = anchorPinRadius;
  const pinCircleCenterY = pinSVGSize - anchorPinHeight - anchorPinRadius;
  
  // Décalage pour positionner le marqueur au-dessus et à droite de l'épingle
  // Le bas du marqueur doit correspondre à la pointe de l'épingle (pinPointY)
  // Donc markerOffsetY + markerSize = pinPointY
  // Donc markerOffsetY = pinPointY - markerSize
  const markerOffsetX = pinCircleCenterX + gap;
  const markerOffsetY = pinPointY - markerSize;
  
  // Pour toutes les formes, l'épingle est maintenant un marqueur séparé
  // Le marqueur principal ne contient que la forme (carré, hexagone, cercle) décalée
  if (shape === "square") {
    // Le carré est positionné au-dessus et à droite de l'épingle
    const markerContainer = document.createElement("div");
    markerContainer.innerHTML = markerSVG;
    markerContainer.style.cssText = `
      width: ${markerSize}px;
      height: ${markerSize}px;
      position: absolute;
      top: ${markerOffsetY}px;
      left: ${markerOffsetX}px;
      overflow: visible;
    `;
    div.appendChild(markerContainer);
    
    // Ajuster la taille du conteneur pour accommoder le marqueur décalé
    // L'ancrage est à la pointe de l'épingle (pinPointX, pinPointY)
    const containerWidth = Math.max(markerOffsetX + markerSize, pinPointX + 5);
    const containerHeight = Math.max(markerOffsetY + markerSize, pinPointY + 5);
    
    div.style.width = `${containerWidth}px`;
    div.style.height = `${containerHeight}px`;
  } else {
    // Pour les autres formes (hexagone, cercle), positionner au-dessus et à droite de l'épingle
    const svgContainer = document.createElement("div");
    svgContainer.innerHTML = markerSVG;
    svgContainer.style.cssText = `
      width: ${markerSize}px;
      height: ${markerSize}px;
      position: absolute;
      top: ${markerOffsetY}px;
      left: ${markerOffsetX}px;
    `;
    div.appendChild(svgContainer);
    
    // Ajuster la taille du conteneur pour accommoder le marqueur décalé
    // L'ancrage est à la pointe de l'épingle (pinPointX, pinPointY)
    const containerWidth = Math.max(markerOffsetX + markerSize, pinPointX + 5);
    const containerHeight = Math.max(markerOffsetY + markerSize, pinPointY + 5);
    
    div.style.width = `${containerWidth}px`;
    div.style.height = `${containerHeight}px`;
  }

  // Ajouter le texte de valeur si présent
  if (value !== undefined && value !== null) {
    const displayValue = Math.round(value);
    const valueText = document.createElement("div");
    valueText.textContent = displayValue.toString();
    valueText.className = "value-text";
    
    // Centrer le texte par rapport au marqueur décalé
    // Utiliser les mêmes valeurs que calculées précédemment pour le positionnement du marqueur
    const textOffsetX = markerOffsetX + markerSize / 2;
    const textOffsetY = markerOffsetY + markerSize / 2;
    
    valueText.style.cssText = `
      position: absolute;
      top: ${textOffsetY}px;
      left: ${textOffsetX}px;
      transform: translate(-50%, -52%);
      color: ${getTextColor(qualityLevel)};
      font-weight: bold;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: none;
      z-index: 10;
      text-align: center;
      line-height: 1;
    `;

    // Ajuster la taille du texte selon la longueur de la valeur et la taille du marqueur
    const baseFontSize = markerSize / 32;
    const shapeMultiplier = shape === "square" ? 1.15 : 1.0;
    
    if (displayValue >= 1000) {
      valueText.style.fontSize = `${10 * baseFontSize * shapeMultiplier}px`;
    } else if (displayValue >= 100) {
      valueText.style.fontSize = `${12 * baseFontSize * shapeMultiplier}px`;
    } else if (displayValue >= 10) {
      valueText.style.fontSize = `${16 * baseFontSize * shapeMultiplier}px`;
    } else {
      valueText.style.fontSize = `${18 * baseFontSize * shapeMultiplier}px`;
    }

    // Ajouter un contour pour améliorer la lisibilité sur les fonds sombres
    if (qualityLevel === "extrMauvais" || qualityLevel === "tresMauvais") {
      valueText.style.textShadow =
        "1px 1px 2px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.8)";
    }

    div.appendChild(valueText);
  }

  // Le contour bleu est maintenant intégré directement dans le SVG du marqueur
  // Plus besoin d'indicateur séparé

  // Ajouter l'effet de sélection si nécessaire
  if (options?.isSelected) {
    const highlightColor = options.highlightColor || color;
    // Préserver le filter (ombre) lors de l'ajout de l'effet de sélection
    div.style.cssText += `
      box-shadow: 0 0 0 3px ${highlightColor}, 0 0 0 6px ${highlightColor}40;
      border-radius: 50%;
      animation: pulse-${qualityLevel} 2s infinite;
      filter: drop-shadow(3px 4px 6px rgba(0, 0, 0, 0.7));
    `;

    // Ajouter l'animation CSS spécifique à chaque niveau
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse-${qualityLevel} {
        0% { 
          box-shadow: 0 0 0 3px ${highlightColor}, 0 0 0 6px ${highlightColor}40; 
        }
        50% { 
          box-shadow: 0 0 0 3px ${highlightColor}, 0 0 0 12px ${highlightColor}20; 
        }
        100% { 
          box-shadow: 0 0 0 3px ${highlightColor}, 0 0 0 6px ${highlightColor}40; 
        }
      }
    `;
    if (!document.head.querySelector(`style[data-highlight-${qualityLevel}]`)) {
      style.setAttribute(`data-highlight-${qualityLevel}`, "true");
      document.head.appendChild(style);
    }
  }

  // Ajouter une animation subtile pendant le chargement
  if (options?.loading) {
    div.style.opacity = "0.7";
    div.style.transform = "scale(0.95)";
    div.style.transition = "all 0.3s ease";
  }

  // L'ancrage du marqueur principal doit être à la position de la pointe de l'épingle
  // pour que le marqueur soit décalé par rapport à l'épingle
  // L'épingle est positionnée exactement à lat/long sur sa pointe, donc l'ancrage doit être
  // à la position de la pointe de l'épingle dans ce conteneur
  // Utiliser les mêmes valeurs que calculées précédemment
  
  // Obtenir les dimensions finales du conteneur
  const finalWidth = parseInt(div.style.width) || initialContainerWidth;
  const finalHeight = parseInt(div.style.height) || initialContainerHeight;
  
  return L.divIcon({
    html: div.outerHTML,
    className: "custom-marker-div svg-marker",
    iconSize: [finalWidth, finalHeight],
    iconAnchor: [pinPointX, pinPointY], // Ancrage à la position de la pointe de l'épingle
  });
}

