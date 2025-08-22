const map = L.map('map').setView([37.3, -119.5], 6);

// basemaps
const darkMatter = L.tileLayer.provider('CartoDB.DarkMatter').addTo(map); // default
const darkMatterNoLbl = L.tileLayer.provider('CartoDB.DarkMatterNoLabels');
const osm = L.tileLayer.provider('OpenStreetMap.Mapnik');

const baseLayers = {
    "Carto DarkMatter": darkMatter,
    "Carto DarkMatter No Labels": darkMatterNoLbl,
    "OpenStreetMap": osm
};

L.control.layers(baseLayers, {}, { collapsed: false }).addTo(map);
const overlays = {};
const control = L.control.layers(null, overlays, { collapsed: false }).addTo(map);
let lastSelected = null;

function addShpCurrent(url, name, show = true) {
    shp(url).then(geojson => {
        const boundaryLayer = L.geoJSON(geojson, {
            style: f => {
                const p = f.properties || {};
                const party = String(p.PARTY || "").trim().toUpperCase();
                if (party.startsWith("D")) {
                    return { weight: 2, color: "#000080", fillColor: "#1f78b4", fillOpacity: 0.4 };
                } else if (party.startsWith("R")) {
                    return { weight: 2, color: "#800000", fillColor: "#e31a1c", fillOpacity: 0.4 };
                } else {
                    return { weight: 2, color: "#4B0082", fillColor: "#984ea3", fillOpacity: 0.4 };
                }
            },
            onEachFeature: (feature, lyr) => {
                const props = feature.properties || {};
                const ignore_keys = [
                    'LAST_UPDAT', 'OFFICE_AUD', 'BIOGUIDE_I',
                    'AWATER', 'ALAND', 'GEOIDFQ', 'GEOID',
                ];
                let html = `<b>${name}</b><br/><table style="border-collapse:collapse;">`;
                for (const k in props) {
                    html += `<tr><td style="border:1px solid #ccc;padding:2px 6px;"><b>${k}</b></td>` +
                        `<td style="border:1px solid #ccc;padding:2px 6px;">${props[k]}</td></tr>`;
                }
                html += "</table>";
                lyr.bindPopup(`<div class="popup-scroll">${html}</div>`, { maxWidth: 480 });
            }
        });

        overlays[name] = boundaryLayer;
        control.addOverlay(boundaryLayer, name);

        if (show) {
            boundaryLayer.addTo(map);
            map.fitBounds(boundaryLayer.getBounds());
        }
    });
}
const palette32 = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
    "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
    "#bcbd22", "#17becf", "#393b79", "#637939",
    "#8c6d31", "#843c39", "#7b4173", "#5254a3",
    "#9c9ede", "#8ca252", "#bd9e39", "#ad494a",
    "#a55194", "#6b6ecf", "#b5cf6b", "#e7ba52",
    "#d6616b", "#ce6dbd", "#9c9ede", "#cedb9c",
    "#e7cb94", "#de9ed6", "#3182bd", "#f33"
];

// PROPOSED plain outlines
function addShpProposed(url, name, show = false) {
    shp(url).then(geojson => {
        const boundaryLayer = L.geoJSON(geojson, {
            style: feature => {
                const p = feature.properties || {};
                const id = parseInt(p.DISTRICT || p.DIST_NUM || p.DISTRICTID || p.CongDist_1 || 0, 10);
                const color = palette32[id % palette32.length];
                return { weight: 2, color, fillOpacity: 0 };   // no fill initially
            },
            onEachFeature: (feature, lyr) => {
                const props = feature.properties || {};
                const id = props.DISTRICT || props.DIST_NUM || props.DISTRICTID || props.CongDist_1;
                const color = palette32[parseInt(id || 0, 10) % palette32.length];

                lyr.bindPopup(`<b>${name}</b><br/>District: ${id}`);

                lyr.on('click', () => {
                    lyr.setStyle({
                        weight: 3,
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.4
                    });
                });

                lyr.on('popupclose', () => {
                    lyr.setStyle({
                        weight: 2,
                        color: color,
                        fillOpacity: 0
                    });
                });

                lyr.on('mouseover', () => lyr.setStyle({ weight: 4 }));
                lyr.on('mouseout', () => {
                    if (!lyr.isPopupOpen()) lyr.setStyle({ weight: 2, color: color, fillOpacity: 0 });
                });
            }
        });

        overlays[name] = boundaryLayer;
        control.addOverlay(boundaryLayer, name);

        if (show) {
            boundaryLayer.addTo(map);
            map.fitBounds(boundaryLayer.getBounds());
        }
    });
}

const PROPOSED_URL = "https://jocorki.github.io/map-diff/AB604/AB604";
const CURRENT_URL = "https://jocorki.github.io/map-diff/Congressional_Districts/Congressional_Districts";

// const PROPOSED_URL = "http://localhost:8000/AB604/AB604";
// const CURRENT_URL = "http://localhost:8000/Congressional_Districts/Congressional_Districts";


addShpCurrent(CURRENT_URL, "Current Districts (CRC 2021)", true);
addShpProposed(PROPOSED_URL, "Proposed Districts (2025 Plan)", false);