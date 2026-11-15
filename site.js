let artworkIndex=0, artworkCarouselReady=false, artworkTransitionLocked=false, artworkTransitionTimer=0;
  let artworkNoTransitionCards=new Set();
  let artworkBodyOverflow='', artworkRootOverflow='';
  function artworkLightboxKeydown(event){if(event.key==='Escape')closeArtworkLightbox();}
  function openArtworkLightbox(image){
    const lightbox=document.getElementById('artwork-lightbox'),fullImage=document.getElementById('artwork-lightbox-image');
    if(!lightbox||!fullImage||!image)return;
    artworkBodyOverflow=document.body.style.overflow;
    artworkRootOverflow=document.documentElement.style.overflow;
    document.body.style.overflow='hidden';
    document.documentElement.style.overflow='hidden';
    fullImage.src=image.currentSrc||image.src;
    fullImage.alt=image.alt||'Full size artwork';
    lightbox.setAttribute('aria-hidden','false');
    lightbox.classList.add('is-open');
    requestAnimationFrame(()=>lightbox.classList.add('is-visible'));
    document.addEventListener('keydown',artworkLightboxKeydown);
    lightbox.querySelector('.artwork-lightbox-close').focus({preventScroll:true});
  }
  function closeArtworkLightbox(){
    const lightbox=document.getElementById('artwork-lightbox');
    if(!lightbox||!lightbox.classList.contains('is-open'))return;
    lightbox.classList.remove('is-visible','is-open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.style.overflow=artworkBodyOverflow;
    document.documentElement.style.overflow=artworkRootOverflow;
    document.removeEventListener('keydown',artworkLightboxKeydown);
    document.querySelector('#artwork-ring .artwork-item.is-active')?.focus({preventScroll:true});
  }
  function artworkElements(){
    const viewport=document.getElementById('artwork-carousel'),ring=document.getElementById('artwork-ring');
    return {viewport,ring,stage:viewport&&viewport.closest('.artwork-carousel-stage'),cards:ring?[...ring.querySelectorAll('.artwork-item')]:[],dots:document.getElementById('artwork-dots')};
  }
  function artworkWrap(value,count){return ((value%count)+count)%count;}
  function renderArtworkCarousel(){
    const parts=artworkElements(),viewport=parts.viewport,stage=parts.stage,cards=parts.cards;
    if(!viewport||!viewport.clientWidth||!cards.length)return;
    const width=viewport.clientWidth,mobile=width<=768;
    const cardWidth=mobile?Math.min(width*.72,350):Math.min(width*.39,410);
    const cardHeight=mobile?(width<=520?420:460):570;
    const noTransitionNow=artworkNoTransitionCards;
    artworkNoTransitionCards=new Set();
    cards.forEach((card,index)=>{
      let offset=index-artworkIndex;
      if(offset>cards.length/2)offset-=cards.length;
      if(offset< -cards.length/2)offset+=cards.length;
      const distance=Math.abs(offset),side=offset<0?-1:1;
      const slot=Math.min(distance,2);
      const x=distance===0?0:side*(cardWidth+12)*(distance===1?1:.62);
      const rotation=distance===0||mobile?0:(side<0?(distance===1?-40:-75):(distance===1?40:75));
      const z=distance>1?-300:0;
      card.style.width=cardWidth+'px';card.style.height=cardHeight+'px';
      card.style.marginLeft=(-cardWidth/2)+'px';card.style.marginTop=(-cardHeight/2)+'px';
      card.style.zIndex=String(distance===0?100:distance===1?80:40-distance);
      card.style.pointerEvents=distance>1?'none':'auto';
      card.style.transformOrigin=distance===0?'50% 50%':(side<0?'100% 50%':'0% 50%');
      if(noTransitionNow.has(card))card.style.transition='none';
      card.style.transform='translate3d('+x+'px,0,'+z+'px) rotateY('+rotation+'deg) scale(1)';
      if(noTransitionNow.has(card))void card.offsetWidth;
      card.setAttribute('aria-pressed',String(distance===0));
      card.setAttribute('aria-hidden',String(distance>1));card.tabIndex=distance>1?-1:0;
      card.classList.toggle('is-active',distance===0);
      if(noTransitionNow.has(card))requestAnimationFrame(()=>card.style.removeProperty('transition'));
    });
    if(stage)stage.classList.toggle('has-active-artwork',true);
    if(parts.dots)parts.dots.querySelectorAll('.artwork-carousel-dot').forEach((dot,index)=>{
      const active=index===artworkIndex;
      dot.classList.toggle('is-active',active);
      if(active)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current');
    });
  }
  function setArtworkIndex(index){
    const cards=artworkElements().cards;
    if(!cards.length||artworkTransitionLocked)return;
    const requested=artworkWrap(index,cards.length);
    if(requested===artworkIndex)return;
    const previousIndex=artworkIndex;
    const delta=requested-previousIndex;
    const direction=Math.abs(delta)>cards.length/2?-Math.sign(delta):Math.sign(delta);
    artworkIndex=artworkWrap(artworkIndex+direction,cards.length);
    cards.forEach((card,cardIndex)=>{
      let previousOffset=cardIndex-previousIndex;
      if(previousOffset>cards.length/2)previousOffset-=cards.length;
      if(previousOffset< -cards.length/2)previousOffset+=cards.length;
      let nextOffset=cardIndex-artworkIndex;
      if(nextOffset>cards.length/2)nextOffset-=cards.length;
      if(nextOffset< -cards.length/2)nextOffset+=cards.length;
      if(Math.abs(nextOffset-previousOffset)>1)artworkNoTransitionCards.add(card);
    });
    artworkTransitionLocked=true;
    window.clearTimeout(artworkTransitionTimer);
    artworkTransitionTimer=window.setTimeout(()=>{artworkTransitionLocked=false;},520);
    renderArtworkCarousel();
  }
  function rotateArtworkGallery(direction){setArtworkIndex(artworkIndex+direction);}
  function initializeArtworkCarousel(){
    const parts=artworkElements(),viewport=parts.viewport,cards=parts.cards;
    if(!viewport)return;
    if(!artworkCarouselReady){
      artworkCarouselReady=true;
      document.getElementById('artwork-lightbox').addEventListener('click',event=>{
        if(event.target===event.currentTarget)closeArtworkLightbox();
      });
      cards.forEach((card,index)=>{
        const image=card.querySelector('img');if(image)image.alt='Original artwork '+String(index+1).padStart(2,'0');
        card.setAttribute('role','button');card.setAttribute('tabindex','0');
        card.setAttribute('aria-label','Select artwork '+String(index+1).padStart(2,'0'));
        card.addEventListener('keydown',event=>{
          if(event.key==='Enter'||event.key===' '){
            event.preventDefault();
            openArtworkLightbox(card.querySelector('img'));
          }
        });
      });
      if(parts.dots){
        cards.forEach((_,index)=>{
          const dot=document.createElement('button');
          dot.type='button';dot.className='artwork-carousel-dot';
          dot.setAttribute('aria-label','Show artwork '+String(index+1).padStart(2,'0'));
          dot.addEventListener('click',()=>setArtworkIndex(index));
          parts.dots.appendChild(dot);
        });
      }
      let pointer=null,startX=0,lastX=0,dragged=false,wheelAmount=0;
      viewport.addEventListener('pointerdown',event=>{
        if(event.button!==undefined&&event.button!==0)return;
        pointer=event.pointerId;startX=lastX=event.clientX;dragged=false;
        viewport.setPointerCapture(event.pointerId);
      });
      viewport.addEventListener('pointermove',event=>{
        if(event.pointerId!==pointer)return;
        const delta=event.clientX-lastX;lastX=event.clientX;
        if(Math.abs(event.clientX-startX)>35){
          setArtworkIndex(artworkIndex+(event.clientX<startX?1:-1));
          startX=event.clientX;dragged=true;
        }
      });
      const release=event=>{
        if(event.pointerId!==pointer)return;
        pointer=null;
        if(dragged)window.setTimeout(()=>{dragged=false;},80);
      };
      viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
      viewport.addEventListener('click',event=>{
        if(dragged){event.preventDefault();return;}
        const hit=document.elementFromPoint(event.clientX,event.clientY);
        const card=hit?.closest('#artwork-ring .artwork-item');
        if(card)openArtworkLightbox(card.querySelector('img'));
      });
      viewport.addEventListener('wheel',event=>{
        event.preventDefault();wheelAmount+=event.deltaX+event.deltaY;
        if(Math.abs(wheelAmount)>65){setArtworkIndex(artworkIndex+(wheelAmount>0?1:-1));wheelAmount=0;}
      },{passive:false});
      viewport.addEventListener('keydown',event=>{
        if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
          event.preventDefault();rotateArtworkGallery(event.key==='ArrowRight'?1:-1);
        }else if(event.key==='Home'||event.key==='End'){
          event.preventDefault();setArtworkIndex(event.key==='Home'?0:cards.length-1);
        }
      });
      window.addEventListener('resize',renderArtworkCarousel);
    }
    renderArtworkCarousel();
  }

  function showPage(id) {
    const pageFiles = { home: 'index.html', about: 'about.html', projects: 'projects.html', artwork: 'artwork.html', travel: 'travel.html', contact: 'contact.html' };
    if (pageFiles[id]) window.location.href = pageFiles[id];
  }

  const seasonButton = document.getElementById('season-cycle');
  const seasonName = document.getElementById('season-name');
  const validSeasons = ['summer', 'fall', 'winter', 'spring'];
  const seasonNames = {
    summer: 'Summer Dreams', fall: 'Autumn Harvest',
    winter: 'Winter Mist', spring: 'Spring Blossom'
  };

  const seasonalPortraits = {
    summer: 'about%20me/summer%20profile.png',
    fall: 'about%20me/autumn%20profile.png',
    winter: 'about%20me/winter%20profile.png',
    spring: 'about%20me/spring%20profile.png'
  };

  function setSeason(season) {
    const selected = validSeasons.includes(season) ? season : 'summer';
    document.documentElement.setAttribute('data-season', selected);
    seasonName.textContent = seasonNames[selected];
    seasonButton.setAttribute('aria-label', `Choose your season. Current season: ${seasonNames[selected]}. Click to change season.`);
    const portrait = document.querySelector('.profile-photo');
    if (portrait) portrait.src = seasonalPortraits[selected];
    localStorage.setItem('ha-season', selected);
  }

  function cycleSeason() {
    const current = document.documentElement.getAttribute('data-season') || 'summer';
    const next = (validSeasons.indexOf(current) + 1) % validSeasons.length;
    setSeason(validSeasons[next]);
  }

  function flipSkillCard(card) {
    const flipped = card.classList.toggle('is-flipped');
    const category = card.querySelector('.skill-card-front strong').textContent.trim();
    card.setAttribute('aria-pressed', String(flipped));
    card.setAttribute('aria-label', `${category}. ${flipped ? 'Click to show the front.' : 'Click to see details.'}`);
    card.querySelector('.skill-card-front').setAttribute('aria-hidden', String(flipped));
    card.querySelector('.skill-card-back').setAttribute('aria-hidden', String(!flipped));
  }

  seasonButton.addEventListener('click', cycleSeason);
  setSeason(localStorage.getItem('ha-season') || 'summer');

  const travelSheetId = '1iXmKQNwT6he-z73oe27M9YpT22eOifyS';
  const placesSheetGid = '1634872468';
  const travelRowsCacheKey = 'ha-travel-rows-cache-v1';
  const travelGeocoderEndpoint = 'https://nominatim.openstreetmap.org/search';
  let travelStarted = false;
  let travelMapReady = false;
  let travelRows = [];
  let geocodeTimer;
  let travelSummaryText = '';
  let travelPlotlyPromise = null;

  function loadTravelMapLibrary() {
    if (window.Plotly) return Promise.resolve(true);
    if (travelPlotlyPromise) return travelPlotlyPromise;
    travelPlotlyPromise = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'vendor/plotly-geo-4.2.0.min.js';
      script.async = true;
      script.onload = () => {
        const loaded = Boolean(window.Plotly);
        if (!loaded) travelPlotlyPromise = null;
        resolve(loaded);
      };
      script.onerror = () => { travelPlotlyPromise = null; resolve(false); };
      document.head.appendChild(script);
    });
    return travelPlotlyPromise;
  }

  function readTravelRowsCache() {
    try {
      const saved = JSON.parse(localStorage.getItem(travelRowsCacheKey) || 'null');
      if (!Array.isArray(saved?.rows) || !saved.rows.length) return null;
      const rows = saved.rows.filter(place => place && Number.isFinite(Number(place.year)) && place.city && place.country)
        .map(place => {
          const row = { year: Number(place.year), month: Number(place.month) || 0, city: String(place.city), country: String(place.country), memories: String(place.memories || '') };
          const latitude = place.latitude === '' || place.latitude == null ? NaN : Number(place.latitude);
          const longitude = place.longitude === '' || place.longitude == null ? NaN : Number(place.longitude);
          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            row.latitude = latitude; row.longitude = longitude; row.coordinates = { lat: latitude, lon: longitude };
          }
          return row;
        });
      return rows.length ? { rows, savedAt: Number(saved.savedAt) || 0 } : null;
    } catch (_) { return null; }
  }

  function saveTravelRowsCache(rows) {
    try {
      const cleanRows = rows.map(place => ({
        year: place.year, month: place.month, city: place.city, country: place.country, memories: place.memories || '',
        latitude: Number.isFinite(place.coordinates?.lat) ? place.coordinates.lat : place.latitude ?? null,
        longitude: Number.isFinite(place.coordinates?.lon) ? place.coordinates.lon : place.longitude ?? null
      }));
      localStorage.setItem(travelRowsCacheKey, JSON.stringify({ rows: cleanRows, savedAt: Date.now() }));
    } catch (_) { /* Keep live data available even when browser storage is disabled. */ }
  }

  function restoreCachedCoordinates(rows) {
    rows.forEach(place => {
      if (Number.isFinite(place.coordinates?.lat) && Number.isFinite(place.coordinates?.lon)) return;
      const coordinates = loadCachedCoordinates(place);
      if (coordinates) place.coordinates = coordinates;
    });
  }

  function useFallbackCoordinates(rows, fallbackRows) {
    const known = new Map((fallbackRows || []).filter(place => Number.isFinite(place.coordinates?.lat) && Number.isFinite(place.coordinates?.lon))
      .map(place => [travelKey(place), place.coordinates]));
    rows.forEach(place => {
      if (!place.coordinates && known.has(travelKey(place))) place.coordinates = known.get(travelKey(place));
    });
  }

  function parseTravelCSV(csv) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < csv.length; i += 1) {
      const char = csv[i];
      if (quoted && char === '"' && csv[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { row.push(field.trim()); field = ''; }
      else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && csv[i + 1] === '\n') i += 1;
        row.push(field.trim());
        if (row.some(cell => cell !== '')) rows.push(row);
        row = []; field = '';
      } else field += char;
    }
    if (field || row.length) { row.push(field.trim()); rows.push(row); }
    if (!rows.length) throw new Error('The Places tab is empty.');

    const headers = rows.shift().map(value => value.replace(/^\uFEFF/, '').toLowerCase());
    const column = pattern => headers.findIndex(header => pattern.test(header));
    const yearIndex = column(/^year$/), monthIndex = column(/^month$/);
    const cityIndex = column(/^city$/), countryIndex = column(/^country$/);
    const memoriesIndex = column(/^memories?$/);
    const latitudeIndex = column(/^latitude$|^lat$/), longitudeIndex = column(/^longitude$|^lon$|^lng$/);
    const publishIndex = column(/publish|public|website|share/);
    if ([yearIndex, cityIndex, countryIndex].some(index => index < 0)) {
      throw new Error('Could not find Year, City, and Country columns in the Places tab.');
    }
    return rows.map(cells => {
      const latitude = latitudeIndex >= 0 && (cells[latitudeIndex] || '').trim() !== '' ? Number(cells[latitudeIndex]) : NaN;
      const longitude = longitudeIndex >= 0 && (cells[longitudeIndex] || '').trim() !== '' ? Number(cells[longitudeIndex]) : NaN;
      const place = {
        year: Number(cells[yearIndex]),
        month: monthIndex >= 0 ? Number(cells[monthIndex]) || 0 : 0,
        city: (cells[cityIndex] || '').trim(),
        country: (cells[countryIndex] || '').trim(),
        memories: memoriesIndex >= 0 ? (cells[memoriesIndex] || '').trim() : '',
        publish: publishIndex >= 0 ? (cells[publishIndex] || '').trim().toLowerCase() : ''
      };
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        place.latitude = latitude; place.longitude = longitude; place.coordinates = { lat: latitude, lon: longitude };
      }
      return place;
    }).filter(place => place.city && place.country && Number.isFinite(place.year))
      .filter(place => publishIndex < 0 || ['yes', 'y', 'true', 'public', 'publish'].includes(place.publish));
  }

  async function fetchLiveTravelRows() {
    const sources = [
      { url: `https://docs.google.com/spreadsheets/d/${travelSheetId}/export?format=csv&gid=${placesSheetGid}&_=${Date.now()}`, type: 'csv' },
      { url: `https://docs.google.com/spreadsheets/d/${travelSheetId}/gviz/tq?tqx=out:csv&gid=${placesSheetGid}&_=${Date.now()}`, type: 'csv' }
    ];
    let lastError;
    for (const source of sources) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(source.url, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(`Data responded ${response.status}`);
        const csv = await response.text();
        if (/<!doctype html|<html/i.test(csv.slice(0, 300))) throw new Error('The data returned a sign-in page.');
        const rows = parseTravelCSV(csv);
        if (!rows.length) throw new Error('No published travel rows were found.');
        return rows;
      } catch (error) { lastError = error; }
      finally { window.clearTimeout(timeout); }
    }
    throw lastError || new Error('The live travel data could not be reached.');
  }

  async function fetchTravelFallbackRows() {
    const response = await fetch('./travel-fallback.csv', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Local fallback responded ${response.status}`);
    const rows = parseTravelCSV(await response.text());
    if (!rows.length) throw new Error('The local fallback has no published travel rows.');
    return rows;
  }

  function travelKey(place) { return `${place.city.toLocaleLowerCase()}|${place.country.toLocaleLowerCase()}`; }
  function uniqueTravelPlaces(rows) {
    const unique = new Map();
    rows.forEach(place => unique.set(travelKey(place), place));
    return [...unique.values()];
  }
  function travelYearColor(year) {
    const hue = ((Number(year) * 137.508) % 360 + 360) % 360;
    return `hsl(${hue.toFixed(0)} 55% 67%)`;
  }
  function formatCount(value) { return new Intl.NumberFormat().format(value); }
  const allCountries = 195;
  const countryAliases = {
    'england': 'United Kingdom', 'scotland': 'United Kingdom', 'wales': 'United Kingdom',
    'northern ireland': 'United Kingdom', 'great britain': 'United Kingdom', 'uk': 'United Kingdom',
    'britain': 'United Kingdom', 'united states of america': 'United States', 'usa': 'United States',
    'the netherlands': 'Netherlands', 'czech republic': 'Czechia', 'republic of korea': 'South Korea',
    'korea, south': 'South Korea', 'korea, north': 'North Korea', 'turkiye': 'Turkey',
    'viet nam': 'Vietnam', 'cape verde': 'Cabo Verde', 'ivory coast': 'Côte d’Ivoire',
    'swaziland': 'Eswatini', 'burma': 'Myanmar', 'east timor': 'Timor-Leste',
    'macedonia': 'North Macedonia', 'palestine': 'Palestine', 'vatican': 'Vatican City'
  };
  function canonicalTravelCountry(country) {
    const value = String(country || '').trim();
    return countryAliases[value.toLowerCase()] || value;
  }

  const continentCountries = {
    Africa: 'Algeria|Angola|Benin|Botswana|Burkina Faso|Burundi|Cabo Verde|Cameroon|Central African Republic|Chad|Comoros|Congo|Côte d’Ivoire|Djibouti|Egypt|Equatorial Guinea|Eritrea|Eswatini|Ethiopia|Gabon|Gambia|Ghana|Guinea|Guinea-Bissau|Kenya|Lesotho|Liberia|Libya|Madagascar|Malawi|Mali|Mauritania|Mauritius|Morocco|Mozambique|Namibia|Niger|Nigeria|Rwanda|São Tomé and Príncipe|Senegal|Seychelles|Sierra Leone|Somalia|South Africa|South Sudan|Sudan|Tanzania|Togo|Tunisia|Uganda|Zambia|Zimbabwe',
    Asia: 'Afghanistan|Armenia|Azerbaijan|Bahrain|Bangladesh|Bhutan|Brunei|Cambodia|China|Cyprus|Georgia|India|Indonesia|Iran|Iraq|Israel|Japan|Jordan|Kazakhstan|Kuwait|Kyrgyzstan|Laos|Lebanon|Malaysia|Maldives|Mongolia|Myanmar|Nepal|North Korea|Oman|Pakistan|Palestine|Philippines|Qatar|Saudi Arabia|Singapore|South Korea|Sri Lanka|Syria|Taiwan|Tajikistan|Thailand|Timor-Leste|Turkey|Turkmenistan|United Arab Emirates|Uzbekistan|Vietnam|Yemen',
    Europe: 'Albania|Andorra|Austria|Belarus|Belgium|Bosnia and Herzegovina|Bulgaria|Croatia|Czechia|Denmark|Estonia|Finland|France|Germany|Greece|Hungary|Iceland|Ireland|Italy|Kosovo|Latvia|Liechtenstein|Lithuania|Luxembourg|Malta|Moldova|Monaco|Montenegro|Netherlands|North Macedonia|Norway|Poland|Portugal|Romania|Russia|San Marino|Serbia|Slovakia|Slovenia|Spain|Sweden|Switzerland|Ukraine|United Kingdom|Vatican City',
    'North America': 'Antigua and Barbuda|Bahamas|Barbados|Belize|Canada|Costa Rica|Cuba|Dominica|Dominican Republic|El Salvador|Grenada|Guatemala|Haiti|Honduras|Jamaica|Mexico|Nicaragua|Panama|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Trinidad and Tobago|United States',
    'South America': 'Argentina|Bolivia|Brazil|Chile|Colombia|Ecuador|Guyana|Paraguay|Peru|Suriname|Uruguay|Venezuela',
    Oceania: 'Australia|Fiji|Kiribati|Marshall Islands|Micronesia|Nauru|New Zealand|Palau|Papua New Guinea|Samoa|Solomon Islands|Tonga|Tuvalu|Vanuatu',
    Antarctica: 'Antarctica'
  };
  const continentByCountry = new Map(Object.entries(continentCountries).flatMap(([continent, names]) =>
    names.split('|').map(country => [country, continent])
  ));

  function continentForCountry(country) {
    const canonical = canonicalTravelCountry(country);
    return continentByCountry.get(canonical) || null;
  }

  function escapeTravelHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function renderTravelSummary(rows) {
    const cities = uniqueTravelPlaces(rows);
    const countries = new Set(rows.map(place => canonicalTravelCountry(place.country)));
    const continents = new Set([...countries].map(continentForCountry).filter(Boolean));
    const years = new Map();
    const countriesByCity = new Map();
    const citiesByYear = new Map();
    rows.forEach(place => {
      years.set(place.year, (years.get(place.year) || 0) + 1);
      const country = canonicalTravelCountry(place.country);
      if (!countriesByCity.has(country)) countriesByCity.set(country, new Set());
      countriesByCity.get(country).add(place.city);
      if (!citiesByYear.has(place.year)) citiesByYear.set(place.year, new Set());
      citiesByYear.get(place.year).add(travelKey(place));
    });
    const busiest = [...years.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    const favorite = [...countriesByCity.entries()].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))[0];
    document.getElementById('travel-cities').textContent = formatCount(cities.length);
    document.getElementById('travel-countries').textContent = formatCount(countries.size);
    document.getElementById('travel-continents').textContent = formatCount(continents.size);
    document.getElementById('travel-busiest').textContent = busiest ? `${busiest[0]} · ${busiest[1]} stops` : '—';
    document.getElementById('travel-country').textContent = favorite ? `${favorite[0]} · ${favorite[1].size} cities` : '—';
    document.getElementById('travel-countries-world').textContent = `${countries.size} / ${allCountries}`;

    const chart = document.getElementById('travel-year-chart');
    const chartRows = [...citiesByYear.entries()].sort((a, b) => a[0] - b[0]);
    const maxCount = Math.max(1, ...chartRows.map(([, set]) => set.size));
    chart.innerHTML = chartRows.map(([year, set]) => `<div class="travel-year-row"><span>${year}</span><div class="travel-year-track"><div class="travel-year-bar" style="--year-color:${travelYearColor(year)};width:${Math.max(3, set.size / maxCount * 100)}%"></div></div><span class="travel-year-count">${set.size}</span></div>`).join('') || '<p>No published travel rows yet.</p>';

    const yearSelect = document.getElementById('travel-year-filter');
    if (yearSelect) {
      const selectedYear = yearSelect.value;
      yearSelect.innerHTML = '<option value="all">All years</option>' + [...years.keys()].sort((a, b) => b - a).map(year => `<option value="${year}">${year}</option>`).join('');
      if ([...yearSelect.options].some(option => option.value === selectedYear)) yearSelect.value = selectedYear;
    }

    travelSummaryText = cities.length
      ? `My diary has ${cities.length} cities across ${countries.size} countries or regions, recorded as ${rows.length} travel stops. ${busiest ? `${busiest[0]} was my busiest year.` : ''} ${favorite ? `${favorite[0]} has my most explored cities (${favorite[1].size}).` : ''} The distance estimate follows the listed stops in date order and measures straight-line legs, so real routes may be longer.`
      : 'No travel rows are currently marked for publishing in the data source.';
    document.getElementById('travel-insight').textContent = travelSummaryText;
  }

  function initTravelMap() {
    if (!window.Plotly || travelMapReady) return;
    travelMapReady = true;
    document.getElementById('travel-year-filter')?.addEventListener('change', renderTravelMap);
  }

  function bindTravelMemoryEvents() {
    const map = document.getElementById('travel-map');
    const actions = document.getElementById('travel-memory-actions');
    if (!map || !actions || map._travelMemoryEventsBound || typeof map.on !== 'function') return;
    map._travelMemoryEventsBound = true;
    const showMemories = event => {
      const point = event?.points?.[0];
      if (!point || !actions) return;
      let matches = [];
      if (point.data?.type === 'choropleth') {
        const country = canonicalTravelCountry(point.location || '');
        matches = travelRows.filter(place => canonicalTravelCountry(place.country) === country && place.memories);
      } else {
        const data = point.customdata || [];
        const city = String(data[0] || '');
        const country = String(data[1] || '');
        matches = travelRows.filter(place => place.city === city && place.country === country && place.memories);
      }
      const unique = new Map();
      matches.forEach(place => {
        const url = safeTravelMemoryURL(place.memories);
        if (url && !unique.has(url)) unique.set(url, place);
      });
      actions.replaceChildren();
      const label = document.createElement('span');
      const pointName = point.data?.type === 'choropleth' ? String(point.location || 'Country') : String(point.customdata?.[0] || 'Place');
      label.textContent = unique.size ? `Memories for ${pointName}:` : `No memories linked for ${pointName} yet.`;
      actions.append(label);
      unique.forEach((place, url) => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = unique.size > 1 ? `See memories · ${place.city} ↗` : 'See memories ↗';
        actions.append(link);
      });
      actions.classList.add('is-visible');
    };
    map.on('plotly_hover', showMemories);
    map.on('plotly_click', showMemories);
  }

  function safeTravelMemoryURL(value) {
    try {
      const url = new URL(String(value || ''), window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }

  function renderTravelMap() {
    if (!travelMapReady || !window.Plotly) return;
    const chosen = document.getElementById('travel-year-filter')?.value || 'all';
    const selectedRows = travelRows.filter(place => chosen === 'all' || String(place.year) === chosen);
    const visitedCountries = [...new Set(selectedRows.map(place => canonicalTravelCountry(place.country)))];
    const mapped = travelRows.filter(place => place.coordinates && (chosen === 'all' || String(place.year) === chosen))
      .sort((a, b) => a.year - b.year || a.month - b.month);
    const byYear = new Map();
    mapped.forEach(place => {
      if (!byYear.has(place.year)) byYear.set(place.year, []);
      byYear.get(place.year).push(place);
    });
    const visitedFill = '#e7a2c5';
    const traces = visitedCountries.length ? [{
      type: 'choropleth', locations: visitedCountries, locationmode: 'country names',
      z: visitedCountries.map(() => 1), zmin: 0, zmax: 1, autocolorscale: false,
      colorscale: [[0, visitedFill], [1, visitedFill]], showscale: false,
      marker: { line: { color: '#fffaf6', width: 0.8 } },
      hovertemplate: '<b>%{location}</b><br>Visited<extra></extra>', showlegend: false
    }] : [];
    byYear.forEach((places, year) => {
      const color = travelYearColor(year);
      const ordered = [...places].sort((a, b) => a.month - b.month);
      const routeLon = [], routeLat = [];
      ordered.forEach((place, index) => {
        if (index && Math.abs(place.coordinates.lon - ordered[index - 1].coordinates.lon) > 180) {
          routeLon.push(null); routeLat.push(null);
        }
        routeLon.push(place.coordinates.lon); routeLat.push(place.coordinates.lat);
      });
      if (places.length > 1) traces.push({
        type: 'scattergeo', mode: 'lines', lon: routeLon, lat: routeLat,
        line: { color, width: 2, dash: 'dot' }, hoverinfo: 'skip', showlegend: false
      });
      traces.push({
        type: 'scattergeo', mode: 'markers', name: String(year),
        lon: places.map(place => place.coordinates.lon),
        lat: places.map(place => place.coordinates.lat),
        customdata: places.map(place => [place.city, place.country, place.month ? new Date(2000, place.month - 1, 1).toLocaleString('en', { month: 'short' }) : '', place.year, place.memories || '']),
        hovertemplate: '<b>%{customdata[0]}</b><br>%{customdata[1]}<br>%{customdata[2]} %{customdata[3]}<extra></extra>',
        marker: { color, size: 10, opacity: 0.95, line: { color: '#fffaf6', width: 1.5 } },
        showlegend: false
      });
    });
    const legend = document.getElementById('travel-legend');
    legend.innerHTML = `<span><i style="background:${visitedFill}"></i>Visited countries</span>` + [...byYear.keys()].sort((a, b) => a - b).map(year => `<span><i style="background:${travelYearColor(year)}"></i>${year}</span>`).join('');
    Plotly.react('travel-map', traces, {
      autosize: true, height: 500, margin: { t: 8, r: 8, b: 8, l: 8 },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      showlegend: false, hoverlabel: { bgcolor: '#fffaf6', bordercolor: '#e1cbd7', font: { color: '#493d45' } },
      geo: {
        scope: 'world', resolution: 110, fitbounds: visitedCountries.length ? 'locations' : false,
        showland: true, landcolor: '#f7eee8', showocean: true, oceancolor: '#e3f1ed',
        showlakes: true, lakecolor: '#e3f1ed', showcountries: true, countrycolor: '#e3d9e0',
        showcoastlines: true, coastlinecolor: '#c8d8d2', showframe: false,
        projection: { type: 'natural earth', minscale: 0.65, maxscale: 7 }
      }
    }, { responsive: true, displayModeBar: false, scrollZoom: true, doubleClick: 'reset', topojsonURL: './vendor/plotly-topojson/' })
      .then(bindTravelMemoryEvents);
  }

  function loadCachedCoordinates(place) {
    try {
      const cached = JSON.parse(localStorage.getItem(`travel-coord:${travelKey(place)}`) || 'null');
      return Number.isFinite(cached?.lat) && Number.isFinite(cached?.lon) ? cached : null;
    }
    catch (_) { return null; }
  }

  function hasRecentGeocodeMiss(place) {
    try {
      const cached = JSON.parse(localStorage.getItem(`travel-coord:${travelKey(place)}`) || 'null');
      return Number.isFinite(cached?.notFoundAt) && Date.now() - cached.notFoundAt < 7 * 24 * 60 * 60 * 1000;
    } catch (_) { return false; }
  }

  function setTravelCoordinates(place, coordinates) {
    travelRows.filter(row => travelKey(row) === travelKey(place)).forEach(row => { row.coordinates = coordinates; });
    place.coordinates = coordinates;
  }

  async function geocodeTravelPlaces() {
    const places = uniqueTravelPlaces(travelRows);
    places.forEach(place => {
      const cached = loadCachedCoordinates(place);
      if (cached) setTravelCoordinates(place, cached);
    });
    renderTravelMap();
    const pending = places.filter(place => !place.coordinates && !hasRecentGeocodeMiss(place));
    const status = document.getElementById('travel-map-status');
    for (let index = 0; index < pending.length; index += 1) {
      const place = pending[index];
      status.textContent = `Finding map pins for ${place.city}, ${place.country} (${index + 1} of ${pending.length})…`;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const query = new URLSearchParams({ city: place.city, country: place.country, format: 'jsonv2', limit: '1' });
        const response = await fetch(`${travelGeocoderEndpoint}?${query}`, { headers: { Accept: 'application/json' }, cache: 'force-cache', signal: controller.signal });
        if (!response.ok) throw new Error('Geocoder unavailable');
        const results = await response.json();
        if (results[0]) {
          const coordinates = { lat: Number(results[0].lat), lon: Number(results[0].lon) };
          setTravelCoordinates(place, coordinates);
          localStorage.setItem(`travel-coord:${travelKey(place)}`, JSON.stringify(coordinates));
        } else localStorage.setItem(`travel-coord:${travelKey(place)}`, JSON.stringify({ notFoundAt: Date.now() }));
      } catch (_) { /* Keep the place in the diary; it can be retried on refresh. */ }
      finally { window.clearTimeout(timeout); }
      if ((index + 1) % 5 === 0 || index === pending.length - 1) renderTravelMap();
      if (index < pending.length - 1) await new Promise(resolve => { geocodeTimer = setTimeout(resolve, 1100); });
    }

    renderTravelMap();
    const mappedCount = uniqueTravelPlaces(travelRows.filter(place => place.coordinates)).length;
    const distance = estimateTravelDistance(travelRows.filter(place => place.coordinates));
    document.getElementById('travel-map-status').textContent = mappedCount
      ? `${mappedCount} of ${places.length} places mapped · estimated straight-line route: ${formatDistance(distance)}.`
      : 'The diary loaded, but the map service could not place these cities. Try refreshing in a moment.';
    document.getElementById('travel-insight').textContent = travelSummaryText + (mappedCount
      ? ` Together, the mapped stops span about ${formatDistance(distance)} in straight-line distance.`
      : ' The route distance will appear when map coordinates are available.');
  }

  function estimateTravelDistance(rows) {
    const ordered = rows.filter(place => place.coordinates).sort((a, b) => a.year - b.year || a.month - b.month);
    let total = 0;
    for (let index = 1; index < ordered.length; index += 1) {
      const one = ordered[index - 1].coordinates, two = ordered[index].coordinates;
      const radians = degrees => degrees * Math.PI / 180;
      const dLat = radians(two.lat - one.lat), dLon = radians(two.lon - one.lon);
      const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(one.lat)) * Math.cos(radians(two.lat)) * Math.sin(dLon / 2) ** 2;
      total += 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
    }
    return total;
  }

  function formatDistance(kilometers) {
    return kilometers >= 1000 ? `${(kilometers / 1000).toFixed(1)}k km` : `${Math.round(kilometers).toLocaleString()} km`;
  }

  async function loadTravelData() {
    const status = document.getElementById('travel-map-status');
    if (!status) return;
    const saved = readTravelRowsCache();
    let backupRows = saved?.rows || null;
    let backupLabel = saved?.savedAt ? `saved copy from ${new Date(saved.savedAt).toLocaleDateString()}` : (saved ? 'saved copy' : '');
    let fallbackError = null;
    try {
      backupRows = await fetchTravelFallbackRows();
      backupLabel = 'local backup file';
      saveTravelRowsCache(backupRows);
    } catch (error) { fallbackError = error; }
    if (backupRows) {
      travelRows = backupRows;
      restoreCachedCoordinates(travelRows);
      renderTravelSummary(travelRows);
      document.getElementById('travel-updated').textContent = backupLabel;
      status.textContent = 'Showing saved places while the map opens…';
    } else status.textContent = 'Checking the live travel data…';
    const mapPromise = loadTravelMapLibrary().then(loaded => {
      if (!loaded) return false;
      initTravelMap();
      if (travelRows.length) renderTravelMap();
      return true;
    });
    if (backupRows) renderTravelMap();
    try {
      travelRows = await fetchLiveTravelRows();
      useFallbackCoordinates(travelRows, backupRows);
      restoreCachedCoordinates(travelRows);
      if (travelRows.length) saveTravelRowsCache(travelRows);
      renderTravelSummary(travelRows);
      document.getElementById('travel-updated').textContent = `refreshed ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      if (!travelRows.length) {
        renderTravelMap();
        document.getElementById('travel-legend').textContent = '';
        status.textContent = 'The data loaded, but no rows are marked Yes in its Publish column.';
        return;
      }
      const mapLoaded = await mapPromise;
      if (!mapLoaded) {
        status.textContent = 'The travel data loaded, but the map library did not. The summary and chart are still available.';
        return;
      }
      await geocodeTravelPlaces();
    } catch (error) {
      if (backupRows) {
        travelRows = backupRows;
        restoreCachedCoordinates(travelRows);
        renderTravelSummary(travelRows);
        const mapLoaded = await mapPromise;
        if (mapLoaded) { initTravelMap(); renderTravelMap(); }
        status.textContent = `Showing ${backupLabel}; live travel data could not be reached.${mapLoaded ? '' : ' The map library is unavailable.'}`;
        document.getElementById('travel-updated').textContent = backupLabel;
        return;
      }
      status.textContent = `Could not load travel data. ${fallbackError?.message || ''} ${error.message || ''} Refresh to try again.`;
      document.getElementById('travel-insight').textContent = 'Travel data will appear after a successful connection to the sheet or the local fallback file.';
      document.getElementById('travel-updated').textContent = 'data unavailable';
    }
  }

  document.getElementById('travel-refresh')?.addEventListener('click', loadTravelData);
  window.setInterval(() => {
    if (travelStarted && document.visibilityState === 'visible') loadTravelData();
  }, 5 * 60 * 1000);

  function makePatternTile() {
    const tile = document.createElement('div');
    tile.className = 'viet-tile';
    tile.innerHTML = '<div class="viet-panel"><div class="viet-field"><i class="viet-star viet-s1"></i><i class="viet-star viet-s2"></i><i class="viet-star viet-s3"></i><i class="viet-star viet-s4"></i><i class="viet-flower viet-c1"></i><i class="viet-half-flower viet-c2"></i><i class="viet-half-flower viet-c3"></i><i class="viet-half-flower viet-c4"></i><i class="viet-half-flower viet-c5"></i></div></div>';
    return tile;
  }

  function fillPatternStrips() {
    const tileWidth = 81;
    document.querySelectorAll('.viet-strip').forEach(strip => {
      strip.textContent = '';
      const track = document.createElement('div');
      track.className = 'viet-strip-track';
      const needed = Math.max(12, Math.ceil(window.innerWidth / tileWidth) + 2);
      for (let i = 0; i < needed; i += 1) {
        track.appendChild(makePatternTile());
      }
      strip.appendChild(track);
    });
  }

  fillPatternStrips();
  window.addEventListener('resize', fillPatternStrips);

  const currentPage = document.body.dataset.page;
  if (currentPage === 'artwork') requestAnimationFrame(initializeArtworkCarousel);
  if (currentPage === 'travel') { travelStarted = true; loadTravelData(); }

  const contactForm = document.querySelector('.contact-form');
  contactForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('[type="submit"]');
    const message = document.getElementById('form-msg');
    submitButton.disabled = true;
    message.textContent = 'Sending…';
    message.style.display = 'block';

    try {
      const fields = Object.fromEntries(new FormData(contactForm).entries());
      const response = await fetch(contactForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      const result = await response.json();
      if (!response.ok || result.success === 'false' || result.success === false) {
        throw new Error(result.message || 'The email service could not accept your message.');
      }
      message.textContent = 'Message submitted. Please check your inbox for an activation email if this is your first submission.';
      contactForm.reset();
    } catch (error) {
      message.textContent = `${error.message || 'Could not send your message.'} Please email hannia.hanguyen@gmail.com directly.`;
    } finally {
      submitButton.disabled = false;
    }
  });

