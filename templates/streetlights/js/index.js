import { SlideDeck } from './slidedeck.js';

history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const map = L.map('map', { scrollWheelZoom: false }).setView([39.9526, -75.1652], 12);

const mapboxKey = "pk.eyJ1IjoiZXZ6aG9uZyIsImEiOiJjbXR1amU4NTgwbDJiMndvcHk0cDY1cXZwIn0.04V1QlAtr7xLGktkYOsBfw"
L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
  tileSize: 512,
  zoomOffset: -1,
  detectRetina: true,
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

function getStatusColor(feature) {
  return feature.properties.psip_status === 'N/A' ? '#ca3433' : '#d3cc8c';
}

function bindPoleTooltip(feature, layer) {
  const p = feature.properties;
  layer.bindTooltip(`
    <strong>Pole ${p.pole_num}</strong><br>
    Owner: ${p.owner}<br>
    Last recorded update: ${p.up_date}<br>
    PSIP status: ${p.psip_status}
  `);
}

function makePieIcon(pct, radius = 11) {
  const angle = Math.min(360, Math.max(0, pct)) * 3.6;
  const largeArc = angle > 180 ? 1 : 0;
  const rad = (angle - 90) * Math.PI / 180;
  const x = radius + radius * Math.cos(rad);
  const y = radius + radius * Math.sin(rad);
  const wedge = angle >= 359.99
    ? `<circle cx="${radius}" cy="${radius}" r="${radius}" fill="#2176d2"/>`
    : `<path d="M ${radius} ${radius} L ${radius} 0 A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y} Z" fill="#2176d2"/>`;
  const svg = `<svg width="${radius * 2}" height="${radius * 2}" viewBox="0 0 ${radius * 2} ${radius * 2}">
    <circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="#ffffff" stroke="#333" stroke-width="1"/>
    ${wedge}
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [radius * 2, radius * 2], iconAnchor: [radius, radius] });
}

function getStreetStyle(feature) {
  if (feature.properties.feature_type === 'boundary') {
    return { color: '#f5c04e', weight: 1.5, fill: false };
  }
  const isMajor = feature.properties.road_class === 'major';
  return {
    color: '#ffe9b8',
    weight: isMajor ? 1.8 : 0.6,
    opacity: isMajor ? 0.95 : 0.55,
  };
}

const coverImages = {
  'title-intro': 'images/title-intro.png',
  'psip-overview': 'images/psip-workers-1.jpg',
  'why-led': 'images/psip-workers-2.jpeg',
  'psip-highlights': 'images/psip-highlights.avif',
};

const coverColors = {
  'psip-stats': '#000000',
};

function updateCoverImage() {
  const currentId = slides[deck.currentSlideIndex].id;
  const coverEl = document.getElementById('cover-image');
  const imagePath = coverImages[currentId];
  const color = coverColors[currentId];

  if (imagePath) {
    coverEl.style.backgroundImage = `url('${imagePath}')`;
    coverEl.style.backgroundColor = '';
    coverEl.style.opacity = '1';
  } else if (color) {
    coverEl.style.backgroundImage = 'none';
    coverEl.style.backgroundColor = color;
    coverEl.style.opacity = '1';
  } else {
    coverEl.style.opacity = '0';
  }
}

const highlights = [
  { icon: 'ti-bike', color: '#25cef7', desc: 'Supports public safety by improving visibility for pedestrians, cyclists, and drivers at night. Learn more about the City\'s Vision Zero initiative.' },
  { icon: 'ti-leaf', color: '#58c04d', desc: 'Cuts municipal carbon emissions by nearly 10%, more than any other efficiency project the City has undertaken. Learn more about the Municipal Energy Master Plan.' },
  { icon: 'ti-broadcast', color: '#f3c613', desc: 'Adds remote-controlled lighting and instant outage monitoring for operational efficiencies.' },
  { icon: 'ti-users', color: '#9400c6', desc: 'Supports local businesses and workers through an Economic Opportunity Plan and workforce development agreement.' },
  { icon: 'ti-coin', color: '#f99300', desc: "Pays for itself entirely through energy savings, at no net cost to the City's budget." },
];

function buildHighlightsGrid() {
  const grid = document.getElementById('highlights-grid');
  const panel = document.getElementById('highlights-desc');

  highlights.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.style.backgroundColor = item.color;
    btn.innerHTML = `<i class="ti ${item.icon}"></i>`;
    btn.setAttribute('aria-label', item.desc);
    btn.addEventListener('click', () => {
      panel.textContent = item.desc;
    });
    grid.appendChild(btn);
  });
}

const neighborhoodSlideOptions = {
  style: (feature) => {
    if (feature.geometry.type !== 'Point') {
      return { color: '#2176d2', weight: 3, dashArray: '2 6', fill: false };
    }
    const isUnknown = feature.properties.psip_status === 'N/A';
    const color = getStatusColor(feature);
    return { color: color, weight: 1, fillColor: color, fillOpacity: isUnknown ? 1 : 0.5 };
  },
  pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 3 }),
  onEachFeature: (feature, layer) => {
    if (feature.geometry.type === 'Point') {
      bindPoleTooltip(feature, layer);
    } else if (layer._path) {
      layer._path.classList.add('pulsating-boundary');
    }
  },
};

const container = document.querySelector('.slide-section');
const slides = document.querySelectorAll('.slide');

const slideOptions = {
  'title-intro': {
    style: getStreetStyle,
    onEachFeature: (feature, layer) => {
      if (feature.properties.feature_type === 'street' && layer._path) {
        const isMajor = feature.properties.road_class === 'major';
        layer._path.style.filter = `drop-shadow(0 0 ${isMajor ? 3 : 1.5}px #ffcf5c)`;
      }
    },
  },
  'why-led': {
    style: feature => ({
      fillColor: feature.properties.fill_color,
      color: '#fff',
      weight: 0.5,
      fillOpacity: 0.85,
    }),
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(`${feature.properties.MAPNAME}: ${feature.properties.firearm_incidents} incidents`);
    },
  },
  'streets-owners': {
    pointToLayer: (feature, latlng) => L.marker(latlng, { icon: makePieIcon(feature.properties.pct_city_owned) }),
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(`${feature.properties.MAPNAME}: ${Math.round(feature.properties.pct_city_owned)}% city-owned`);
    },
  },
  'richmond': neighborhoodSlideOptions,
  'upper-kensington': neighborhoodSlideOptions,
  'north-central': neighborhoodSlideOptions,
  'frankford': neighborhoodSlideOptions,
};

const deck = new SlideDeck(container, slides, map, slideOptions);

document.addEventListener('scroll', () => {
  deck.calcCurrentSlideIndex();
  updateCoverImage();
});

deck.preloadFeatureCollections();
deck.syncMapToCurrentSlide();
updateCoverImage();
buildHighlightsGrid();
