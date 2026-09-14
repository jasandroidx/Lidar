import { TerrainTarget, FootstepBreadcrumb } from '../types';

export function generateGPXContent(
  targets: TerrainTarget[],
  breadcrumbs: FootstepBreadcrumb[] = []
): string {
  const timestamp = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Pike Terrain Radar PWA - 1885 Goodspeed Archaeological Survey"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>Pike County Indiana Historical Waypoints and LiDAR Ground Anomalies</name>
    <desc>Field waypoints for 1800s cellar holes, pioneer wells, blockhouses, and historic traces cited in Goodspeed Bros. and Co. 1885 History of Pike County, Indiana.</desc>
    <author>
      <name>Pike Terrain Radar PWA</name>
    </author>
    <time>${timestamp}</time>
  </metadata>
`;

  // Waypoints
  for (const t of targets) {
    const sym = t.category === 'cellar_hole' 
      ? 'Residence' 
      : t.category === 'blockhouse_fort' 
        ? 'Civil' 
        : t.category === 'pioneer_well' 
          ? 'Water Source' 
          : t.category === 'prehistoric_mound' 
            ? 'Summit' 
            : t.category === 'mill_race' 
              ? 'Dam' 
              : 'Trail Head';

    xml += `  <wpt lat="${t.latitude.toFixed(6)}" lon="${t.longitude.toFixed(6)}">
    <ele>${t.elevationMeters}</ele>
    <time>${timestamp}</time>
    <name>${escapeXml(t.name)}</name>
    <desc>${escapeXml(`[${t.verificationStatus.toUpperCase()}] ${t.chronicleSummary} | Anomaly: ${t.anomalyDescription} | Citation: ${t.goodspeedCitation}`)}</desc>
    <sym>${sym}</sym>
    <type>${t.category}</type>
    <extensions>
      <township>${escapeXml(t.township)}</township>
      <pioneerFamily>${escapeXml(t.pioneerFamily)}</pioneerFamily>
      <verificationStatus>${t.verificationStatus}</verificationStatus>
      <dimensions>${escapeXml(t.dimensionsFeet)}</dimensions>
      <fieldNotes>${escapeXml(t.fieldNotes)}</fieldNotes>
    </extensions>
  </wpt>
`;
  }

  // Active track / footsteps if any
  if (breadcrumbs.length > 1) {
    xml += `  <trk>
    <name>Field GPS Footsteps &amp; Canopy Transect</name>
    <desc>Live ground footsteps tracked through Pike County hardwood timber toward historical targets.</desc>
    <trkseg>
`;
    for (const pt of breadcrumbs) {
      xml += `      <trkpt lat="${pt.lat.toFixed(6)}" lon="${pt.lng.toFixed(6)}">
        <time>${new Date(pt.timestamp).toISOString()}</time>
      </trkpt>
`;
    }
    xml += `    </trkseg>
  </trk>
`;
  }

  xml += `</gpx>`;
  return xml;
}

export function downloadGPXFile(targets: TerrainTarget[], breadcrumbs: FootstepBreadcrumb[] = []) {
  const gpxData = generateGPXContent(targets, breadcrumbs);
  const blob = new Blob([gpxData], { type: 'application/gpx+xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `pike_terrain_radar_${dateStr}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
