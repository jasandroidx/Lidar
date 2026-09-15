import { TerrainTarget } from '../types';

export function generateObsidianMarkdown(target: TerrainTarget): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = target.name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();

  return `---
title: "${target.name}"
date_surveyed: ${dateStr}
county: "Pike County, Indiana"
township: "${target.township}"
coordinates: "${target.latitude.toFixed(6)}, ${target.longitude.toFixed(6)}"
elevation_m: ${target.elevationMeters}
status: "${target.verificationStatus}"
category: "${target.category}"
pioneer_family: "${target.pioneerFamily}"
goodspeed_source: "${target.goodspeedCitation}"
tags:
  - archaeology
  - pike-county
  - indiana-history
  - goodspeed-1885
  - ${target.category.replace(/_/g, '-')}
  - ${target.verificationStatus}
---

# ${target.name}

> [!ABSTRACT] Historical Context & Origin
> **Pioneer Family:** [[${target.pioneerFamily}]]  
> **Township:** [[${target.township} Township]]  
> **Year Established:** ${target.yearSettled}  
> **Source Reference:** *${target.goodspeedCitation}*

## 📜 Goodspeed 1885 Historical Chronicle
${target.chronicleSummary}

> [!NOTE] LiDAR Ground Relief & Anomaly Signatures
> **Dimensions:** \`${target.dimensionsFeet}\`  
> **Elevation:** ${target.elevationMeters} meters (${Math.round(target.elevationMeters * 3.28084)} ft) MSL  
> **Field Verification Status:** **${target.verificationStatus.toUpperCase()}**  
> 
> ${target.anomalyDescription ?? '_Unsurveyed - no detector run or site visit._'}

### Observed LiDAR Micro-Features
${(target.lidarFeatures ?? []).map((f) => `- [ ] ${f}`).join('\n')}

---

## 🧭 Field Navigation Telemetry
- **GPS Coordinates:** \`${target.latitude.toFixed(6)}, ${target.longitude.toFixed(6)}\`
- **USGS Quadrangle:** Petersburg / Winslow 7.5' Topographic Sheet
- **Datum:** WGS84
- **Historical Trail Linkage:** [[The Old Indian Trace / Governor's Trace]]

## 📝 Field Archaeologist Notes
${target.fieldNotes || 'No additional field notes entered during current survey.'}

---
*Generated via Pike Terrain Radar PWA — Field Reconnaissance Engine*
`;
}

export function downloadObsidianMarkdown(target: TerrainTarget) {
  const md = generateObsidianMarkdown(target);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug = target.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.href = url;
  link.download = `${slug}-pike-survey.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyObsidianToClipboard(target: TerrainTarget): Promise<boolean> {
  const md = generateObsidianMarkdown(target);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(md);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = md;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export function getObsidianDeepLink(target: TerrainTarget, vaultName: string = 'FieldResearch'): string {
  const name = encodeURIComponent(target.name);
  const content = encodeURIComponent(generateObsidianMarkdown(target));
  const vault = encodeURIComponent(vaultName);
  return `obsidian://new?vault=${vault}&name=${name}&content=${content}`;
}
