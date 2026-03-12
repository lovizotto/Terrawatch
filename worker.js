// ─── TerraWatch Data Worker ─────────────────────────────────
// Runs in background thread. Posts results to main thread incrementally.

const AISYS = `Você é o motor de dados do TerraWatch, monitor global de desastres em tempo real.
Use web_search para buscar eventos REAIS acontecendo AGORA (março 2026).
Retorne APENAS um array JSON puro, sem markdown, sem texto extra:
[{"id":"X","type":"earthquake|volcano|hurricane|cyclone|storm|flood|tsunami|heat|cold","name":"Nome oficial","location":"Cidade, País","lat":0.0,"lng":0.0,"severity":"critical|high|medium|low","source":"Nome da fonte","time":"YYYY-MM-DD","description":"Descrição factual com dados reais","sourceUrl":"https://...","mag":null}]
Regras: lat/lng obrigatórios e precisos. Apenas eventos com confirmação de fonte confiável. Mínimo 5, máximo 20 eventos por resposta.`;

// ─── 200 CITIES for weather monitoring ──────────────────────
// [lat, lng, name, country, heat_thresh, cold_thresh]
const CITIES = [
  // Americas - North
  [64.84,-147.72,'Fairbanks','USA',30,-40],[61.22,-149.9,'Anchorage','USA',25,-30],
  [49.28,-123.12,'Vancouver','Canada',32,-20],[43.65,-79.38,'Toronto','Canada',33,-25],
  [45.5,-73.57,'Montreal','Canada',33,-25],[47.6,-122.33,'Seattle','USA',35,-15],
  [37.77,-122.42,'San Francisco','USA',38,-5],[34.05,-118.24,'Los Angeles','USA',38,-5],
  [33.45,-112.07,'Phoenix','USA',40,0],[36.17,-115.14,'Las Vegas','USA',40,0],
  [39.74,-104.98,'Denver','USA',35,-20],[41.85,-87.65,'Chicago','USA',33,-25],
  [40.71,-74.0,'New York','USA',36,-18],[42.36,-71.06,'Boston','USA',35,-20],
  [29.76,-95.37,'Houston','USA',40,-5],[32.78,-96.8,'Dallas','USA',40,-5],
  [25.77,-80.19,'Miami','USA',38,10],[30.33,-81.66,'Jacksonville','USA',37,0],
  [38.9,-77.04,'Washington DC','USA',35,-15],[39.95,-75.17,'Philadelphia','USA',35,-18],
  [19.43,-99.13,'Mexico City','Mexico',32,5],[20.97,-89.62,'Merida','Mexico',40,15],
  [20.52,-86.95,'Cancun','Mexico',38,15],[22.15,-100.99,'San Luis Potosí','Mexico',38,5],
  // Americas - Central
  [14.64,-90.51,'Guatemala City','Guatemala',36,5],[13.69,-89.19,'San Salvador','El Salvador',38,10],
  [12.13,-86.28,'Managua','Nicaragua',38,10],[9.93,-84.08,'San José','Costa Rica',33,5],
  [8.99,-79.52,'Panama City','Panama',35,15],
  // Americas - Caribbean
  [18.47,-69.95,'Santo Domingo','Dom. Rep.',36,15],[18.54,-72.34,'Port-au-Prince','Haiti',38,15],
  [23.13,-82.38,'Havana','Cuba',35,10],[17.99,-76.79,'Kingston','Jamaica',36,15],
  [18.22,-66.59,'San Juan','Puerto Rico',36,15],
  // Americas - South
  [10.48,-66.88,'Caracas','Venezuela',36,10],[-4.84,-81.24,'Bogotá area (coast)','Colombia',36,10],
  [0.22,-78.51,'Quito','Ecuador',25,5],[-12.05,-77.05,'Lima','Peru',28,5],
  [-16.5,-68.15,'La Paz','Bolivia',20,-5],[-33.45,-70.67,'Santiago','Chile',36,-10],
  [-34.61,-58.38,'Buenos Aires','Argentina',38,-15],[-23.55,-46.63,'São Paulo','Brazil',36,5],
  [-22.9,-43.17,'Rio de Janeiro','Brazil',38,10],[-3.1,-60.02,'Manaus','Brazil',38,15],
  [-15.78,-47.93,'Brasília','Brazil',38,5],[-8.05,-34.88,'Recife','Brazil',36,15],
  [-30.03,-51.23,'Porto Alegre','Brazil',36,-10],[-20.32,-40.34,'Vitória','Brazil',36,5],
  // Europe
  [68.97,23.15,'Tromsø','Norway',20,-35],[64.14,-21.94,'Reykjavik','Iceland',20,-20],
  [59.91,10.75,'Oslo','Norway',30,-25],[59.33,18.07,'Stockholm','Sweden',30,-25],
  [60.17,24.94,'Helsinki','Finland',28,-30],[55.68,12.57,'Copenhagen','Denmark',30,-20],
  [52.52,13.41,'Berlin','Germany',36,-20],[48.86,2.35,'Paris','France',38,-10],
  [51.51,-0.13,'London','UK',36,-10],[53.33,-6.25,'Dublin','Ireland',30,-10],
  [52.23,21.01,'Warsaw','Poland',35,-25],[47.5,19.04,'Budapest','Hungary',37,-20],
  [48.21,16.37,'Vienna','Austria',36,-20],[50.08,14.44,'Prague','Czech Rep.',35,-20],
  [47.38,8.54,'Zurich','Switzerland',35,-20],[45.46,9.19,'Milan','Italy',38,-10],
  [41.9,12.5,'Rome','Italy',38,-5],[40.85,14.27,'Naples','Italy',38,-5],
  [37.5,15.09,'Catania','Italy',40,-2],[37.98,23.73,'Athens','Greece',40,-5],
  [44.82,20.46,'Belgrade','Serbia',38,-20],[44.43,26.1,'Bucharest','Romania',38,-25],
  [42.7,23.32,'Sofia','Bulgaria',38,-20],[40.41,-3.7,'Madrid','Spain',40,-5],
  [41.39,2.15,'Barcelona','Spain',38,-3],[37.39,-5.98,'Seville','Spain',42,-3],
  [38.72,-9.14,'Lisbon','Portugal',38,-3],[55.75,37.62,'Moscow','Russia',30,-35],
  [59.95,30.32,'St. Petersburg','Russia',25,-30],[56.85,60.61,'Yekaterinburg','Russia',25,-35],
  // Africa
  [36.82,10.17,'Tunis','Tunisia',40,-5],[36.74,3.06,'Algiers','Algeria',40,-5],
  [33.99,-6.85,'Rabat','Morocco',38,-5],[30.06,31.25,'Cairo','Egypt',42,0],
  [15.55,32.54,'Khartoum','Sudan',43,5],[12.37,43.15,'Djibouti','Djibouti',44,10],
  [11.85,15.6,'N\'Djamena','Chad',43,10],[13.52,2.12,'Niamey','Niger',43,10],
  [12.37,-1.53,'Ouagadougou','Burkina Faso',42,10],[14.69,-17.44,'Dakar','Senegal',36,10],
  [4.36,18.56,'Bangui','C. African Rep.',36,10],[-1.29,36.82,'Nairobi','Kenya',30,5],
  [2.05,45.34,'Mogadishu','Somalia',36,10],[9.03,38.74,'Addis Ababa','Ethiopia',25,5],
  [-4.32,15.32,'Kinshasa','DR Congo',34,10],[-8.84,13.23,'Luanda','Angola',36,10],
  [-25.97,32.57,'Maputo','Mozambique',36,5],[-18.91,47.54,'Antananarivo','Madagascar',30,5],
  [-26.32,31.13,'Mbabane','Eswatini',36,-5],[-33.93,18.42,'Cape Town','S. Africa',36,-5],
  [-29.86,30.98,'Durban','S. Africa',36,0],[-26.2,28.04,'Johannesburg','S. Africa',35,-5],
  // Middle East
  [41.01,28.96,'Istanbul','Turkey',38,-10],[39.93,32.86,'Ankara','Turkey',38,-20],
  [37.08,37.38,'Gaziantep','Turkey',38,-20],[36.2,36.16,'Hatay','Turkey',36,-10],
  [33.89,35.5,'Beirut','Lebanon',36,-5],[31.95,35.95,'Amman','Jordan',38,-5],
  [31.77,35.22,'Jerusalem','Israel',36,-5],[32.09,34.78,'Tel Aviv','Israel',36,0],
  [33.34,44.4,'Baghdad','Iraq',43,0],[29.37,47.98,'Kuwait City','Kuwait',45,5],
  [24.69,46.72,'Riyadh','Saudi Arabia',44,5],[21.39,39.86,'Jeddah','Saudi Arabia',42,10],
  [25.29,51.53,'Doha','Qatar',42,10],[24.47,54.37,'Abu Dhabi','UAE',42,10],
  [23.61,58.59,'Muscat','Oman',40,10],[15.35,44.21,'Sanaa','Yemen',36,5],
  [35.7,51.42,'Tehran','Iran',38,-15],[29.6,52.53,'Shiraz','Iran',40,-10],
  // South & Central Asia
  [33.72,73.04,'Islamabad','Pakistan',40,-5],[24.86,67.01,'Karachi','Pakistan',40,5],
  [31.56,74.34,'Lahore','Pakistan',40,-5],[28.61,77.23,'New Delhi','India',42,5],
  [19.08,72.88,'Mumbai','India',36,15],[22.57,88.36,'Kolkata','India',36,10],
  [13.08,80.28,'Chennai','India',38,15],[12.97,77.59,'Bangalore','India',33,5],
  [23.73,90.4,'Dhaka','Bangladesh',36,10],[27.71,85.31,'Kathmandu','Nepal',28,-10],
  [6.93,79.84,'Colombo','Sri Lanka',34,15],[4.18,73.51,'Male','Maldives',32,20],
  [34.53,69.17,'Kabul','Afghanistan',35,-20],[39.92,32.85,'Ankara','Turkey',38,-20],
  [41.3,69.27,'Tashkent','Uzbekistan',40,-15],[42.87,74.59,'Bishkek','Kyrgyzstan',35,-25],
  [43.26,76.9,'Almaty','Kazakhstan',36,-30],[55.17,61.42,'Chelyabinsk','Russia',28,-35],
  [51.18,71.45,'Nur-Sultan','Kazakhstan',28,-40],[53.9,27.57,'Minsk','Belarus',30,-30],
  // East & SE Asia
  [55.75,37.62,'Moscow','Russia',30,-35],[39.93,116.39,'Beijing','China',36,-20],
  [31.23,121.47,'Shanghai','China',36,-10],[23.13,113.26,'Guangzhou','China',36,0],
  [22.35,114.18,'Hong Kong','China',36,5],[25.05,121.53,'Taipei','Taiwan',35,5],
  [35.69,139.69,'Tokyo','Japan',35,-10],[34.69,135.5,'Osaka','Japan',35,-10],
  [43.06,141.35,'Sapporo','Japan',28,-20],[33.58,130.4,'Fukuoka','Japan',34,-5],
  [37.57,126.98,'Seoul','South Korea',33,-25],[35.87,128.6,'Daegu','South Korea',35,-20],
  [21.03,105.85,'Hanoi','Vietnam',34,5],[10.82,106.63,'Ho Chi Minh','Vietnam',36,15],
  [13.75,100.52,'Bangkok','Thailand',38,15],[11.56,104.93,'Phnom Penh','Cambodia',36,15],
  [17.97,102.6,'Vientiane','Laos',36,10],[16.87,96.17,'Yangon','Myanmar',36,10],
  [1.35,103.82,'Singapore','Singapore',34,20],[3.14,101.69,'Kuala Lumpur','Malaysia',34,15],
  [-6.21,106.85,'Jakarta','Indonesia',34,15],[-7.8,110.37,'Yogyakarta','Indonesia',32,15],
  [-8.67,115.21,'Bali','Indonesia',34,15],[14.6,121.0,'Manila','Philippines',34,15],
  [10.31,123.89,'Cebu','Philippines',34,15],
  // Pacific & Oceania
  [-36.87,174.77,'Auckland','New Zealand',30,-5],[-41.29,174.78,'Wellington','New Zealand',28,-10],
  [-43.53,172.63,'Christchurch','New Zealand',28,-10],[-17.73,168.32,'Port Vila','Vanuatu',32,15],
  [-9.43,160.05,'Honiara','Solomon Is.',32,15],[-18.14,178.44,'Suva','Fiji',32,15],
  [-33.87,151.21,'Sydney','Australia',38,-5],[-37.82,144.97,'Melbourne','Australia',36,-10],
  [-27.47,153.03,'Brisbane','Australia',38,0],[-31.95,115.86,'Perth','Australia',40,0],
  [-34.93,138.6,'Adelaide','Australia',40,-5],[-12.46,130.84,'Darwin','Australia',38,10],
  [-35.31,149.12,'Canberra','Australia',36,-10],[21.31,-157.86,'Honolulu','USA',32,15],
  [13.48,144.79,'Hagatna','Guam',32,20],
];

// ─── SEISMIC QUERIES ────────────────────────────────────────
const EQ_QUERIES = [
  // USGS - multiple mag/time combos
  {id:'usgs_m6_30d',   url:'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=6&starttime=2026-02-10&limit=100', src:'USGS M6+'},
  {id:'usgs_m5_7d',    url:'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5&starttime=2026-03-05&limit=150', src:'USGS M5+ 7d'},
  {id:'usgs_m4_3d',    url:'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.5&starttime=2026-03-09&limit=200', src:'USGS M4.5+ 3d'},
  {id:'usgs_m7_90d',   url:'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=7&starttime=2025-12-10&limit=50',  src:'USGS M7+ 90d'},
  // EMSC
  {id:'emsc_m5',  url:'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmagnitude=5&starttime=2026-03-01&limit=100', src:'EMSC M5+'},
  {id:'emsc_m6',  url:'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmagnitude=6&starttime=2026-02-10&limit=50',  src:'EMSC M6+'},
  // IRIS
  {id:'iris_m5',  url:'https://service.iris.edu/fdsnws/event/1/query?format=geojson&minmag=5&starttime=2026-03-01&limit=100', src:'IRIS M5+'},
  // GeoNet NZ
  {id:'geonet_m4', url:'https://api.geonet.org.nz/quake?MMI=3', src:'GeoNet NZ'},
  // AFAD Turkey
  {id:'afad', url:'https://deprem.afad.gov.tr/apiv2/event/filter?start=2026-03-01&end=2026-03-12&minmag=4&format=json', src:'AFAD Turkey'},
];

// ─── AI QUERIES (30 targeted searches) ─────────────────────
const AI_QUERIES = [
  // Volcanoes by region
  {id:'ai_vol_pacific', msg:'Vulcões em erupção ativa AGORA no Pacífico: Kilauea, Mauna Loa, Fagradalsfjall, Etna, Stromboli, Merapi, Krakatau, Taal, Mayon, Kanlaon. Apenas eventos de março 2026.'},
  {id:'ai_vol_americas', msg:'Vulcões em alerta elevado nas Américas: Popocatépetl (México), Tungurahua, Cotopaxi (Equador), Villarrica, Calbuco (Chile), Sabancaya (Peru). Março 2026.'},
  {id:'ai_vol_caribbean', msg:'Atividade vulcânica no Caribe e América Central: La Soufrière, Santa Ana, Arenal, Poás, Rincón de la Vieja. Março 2026.'},
  // Earthquakes by region
  {id:'ai_eq_asia', msg:'Terremotos M5.5+ com danos confirmados na Ásia em março 2026: Japão, Taiwan, Filipinas, Indonésia, Papua Nova Guiné.'},
  {id:'ai_eq_mideast', msg:'Terremotos M4.5+ com danos no Oriente Médio e Ásia Central em março 2026: Turquia, Irão, Afeganistão, Paquistão, Nepal.'},
  {id:'ai_eq_americas', msg:'Terremotos M5+ nas Américas em março 2026: Peru, Chile, Equador, Colômbia, América Central, México.'},
  // Hurricanes/Cyclones
  {id:'ai_tc_active', msg:'Ciclones tropicais, tufões ou furacões ativos em março 2026 em qualquer oceano. Inclui categoria, ventos máximos, localização atual, ameaça a terra.'},
  {id:'ai_tc_pacific', msg:'Tempestades tropicais ativas no Pacífico Norte, Pacífico Sul e Oceano Índico em março 2026.'},
  {id:'ai_tc_atlantic', msg:'Sistemas tropicais ativos no Atlântico e Mar do Caribe em março 2026.'},
  // Floods
  {id:'ai_flood_asia', msg:'Enchentes e inundações graves na Ásia em março 2026: Bangladesh, Myanmar, Tailândia, Vietnã, Indonésia, Filipinas, Índia.'},
  {id:'ai_flood_africa', msg:'Inundações e enchentes na África em março 2026: Moçambique, Madagascar, Quênia, Etiópia, Sudão, Níger, Chade, DRC.'},
  {id:'ai_flood_americas', msg:'Enchentes graves nas Américas em março 2026: Brasil, Colômbia, Peru, Argentina, América Central, EUA.'},
  {id:'ai_flood_europe', msg:'Inundações e chuvas extremas na Europa em março 2026.'},
  // Heat extremes
  {id:'ai_heat_global', msg:'Ondas de calor extremo (acima de 40°C) ativos em março 2026: Oriente Médio, Sul da Ásia, Norte da África, Austrália, EUA sudoeste.'},
  {id:'ai_heat_asia', msg:'Calor extremo na Ásia em março 2026: Índia, Paquistão, Bangladesh, subcontinente. Temperaturas recordes, mortes por calor.'},
  // Cold extremes
  {id:'ai_cold_global', msg:'Ondas de frio extremo (abaixo de -20°C) e nevascas extraordinárias em março 2026. Blizzards, colapso de infraestrutura por gelo.'},
  // Wildfires/droughts
  {id:'ai_wildfire', msg:'Incêndios florestais graves ativos em março 2026 com tipo=heat: América do Sul, Australia, Europa Mediterrânea, Califórnia, Grécia.'},
  // Tsunamis
  {id:'ai_tsunami', msg:'Alertas de tsunami emitidos ou ondas de tsunami observadas em março 2026 no Pacífico, Atlântico ou Oceano Índico.'},
  // Landslides/geological
  {id:'ai_geo', msg:'Deslizamentos, desabamentos ou subsidências com vítimas ou deslocamentos em março 2026.'},
  // Humanitarian crises  
  {id:'ai_hum_africa', msg:'Crises humanitárias com desastre natural em curso na África em março 2026: fome, secas, inundações, epidemias ligadas a eventos climáticos.'},
  {id:'ai_hum_mideast', msg:'Crises humanitárias com componente de desastre natural no Oriente Médio em março 2026: Síria, Iêmen, Gaza.'},
  {id:'ai_hum_asia', msg:'Crises humanitárias com desastre natural na Ásia em março 2026: Myanmar, Afeganistão, Coreia do Norte.'},
  // Storms
  {id:'ai_storm_eu', msg:'Tempestades severas, ciclones extratropicais e vendavais na Europa em março 2026. Danos, mortes, infraestrutura.'},
  {id:'ai_storm_us', msg:'Tempestades severas, tornados e granizo nos EUA em março 2026. Sistema de baixa pressão, frentes frias.'},
  {id:'ai_storm_asia', msg:'Monções fora de época, tempestades de areia (haboob) e tempestades severas na Ásia em março 2026.'},
  // Droughts
  {id:'ai_drought', msg:'Secas críticas com impacto humanitário ou agrícola grave em março 2026: Chifre da África, Sahel, Mediterrâneo, América do Sul.'},
  // Specific regions monitoring
  {id:'ai_pacific_ring', msg:'Todos os eventos sísmicos ou vulcânicos significativos no Anel de Fogo do Pacífico em março 2026. Japão, Indonésia, Filipinas, Papua NG, Vanuatu, Tonga.'},
  {id:'ai_central_asia', msg:'Desastres naturais na Ásia Central e Cáucaso em março 2026: Cazaquistão, Uzbequisão, Quirguistão, Tajiquistão, Azerbaijão, Geórgia, Armênia.'},
  {id:'ai_south_america', msg:'Todos os desastres naturais significativos na América do Sul em março 2026: vulcões, terremotos, inundações, deslizamentos.'},
  {id:'ai_oceania', msg:'Desastres naturais na Oceania em março 2026: Austrália (ciclones, incêndios, inundações), Nova Zelândia, ilhas do Pacífico.'},
];

// ─── OTHER API SOURCES ──────────────────────────────────────
async function fetchNASAEONET() {
  const categories = ['volcanoes','severeStorms','earthquakes','floods','wildfires'];
  const results = await Promise.allSettled(categories.map(cat =>
    fetch(`https://eonet.gsfc.nasa.gov/api/v3/events?category=${cat}&days=30&status=open&limit=50`)
      .then(r=>r.json())
  ));
  const events = [];
  results.forEach(r => {
    if(r.status==='fulfilled' && r.value?.events) {
      r.value.events.forEach(e => {
        const geo = e.geometries?.[0];
        if(!geo) return;
        const coords = geo.coordinates;
        const typeMap = {Volcanoes:'volcano',Earthquakes:'earthquake','Severe Storms':'storm',Floods:'flood',Wildfires:'heat'};
        events.push({
          id:'eonet_'+e.id,
          type:typeMap[e.categories?.[0]?.title]||'storm',
          name:e.title,
          location:e.title,
          lat:Array.isArray(coords[0])?coords[0][1]:coords[1],
          lng:Array.isArray(coords[0])?coords[0][0]:coords[0],
          severity:'medium',
          source:'NASA EONET',
          time:geo.date?.slice(0,10)||'',
          description:e.title,
          sourceUrl:e.sources?.[0]?.url||'https://eonet.gsfc.nasa.gov',
        });
      });
    }
  });
  return events;
}

async function fetchReliefWeb() {
  const queries = [
    {q:'earthquake',type:'earthquake'},{q:'flood',type:'flood'},
    {q:'tropical cyclone',type:'hurricane'},{q:'volcano',type:'volcano'},
    {q:'drought',type:'heat'},{q:'landslide',type:'earthquake'},
  ];
  const results = await Promise.allSettled(queries.map(({q,type}) =>
    fetch(`https://api.reliefweb.int/v1/disasters?appname=terrawatch&filter[field]=status&filter[value]=ongoing&filter[field]=type.name&filter[value]=${encodeURIComponent(q)}&fields[include][]=name&fields[include][]=country&fields[include][]=date&fields[include][]=url&limit=20`)
      .then(r=>r.json())
      .then(d => (d.data||[]).map(e=>({
        id:'rw_'+e.id,
        type,
        name:e.fields.name,
        location:e.fields.country?.map(c=>c.name).join(', ')||'Global',
        lat:e.fields.country?.[0]?.location?.lat||0,
        lng:e.fields.country?.[0]?.location?.lon||0,
        severity:'high',
        source:'ReliefWeb',
        time:e.fields.date?.event?.slice(0,10)||'',
        description:e.fields.name,
        sourceUrl:e.fields.url||'https://reliefweb.int',
      })))
  ));
  return results.flatMap(r => r.status==='fulfilled'? r.value:[]);
}

async function fetchGDACS() {
  try {
    const d = await fetch('https://gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromdate=2026-02-10&todate=2026-03-12&alertlevel=Green;Orange;Red&eventlist=EQ;TC;FL;VO;DR;WF&limit=100')
      .then(r=>r.json());
    if(!d?.features) return [];
    const tm={EQ:'earthquake',TC:'hurricane',FL:'flood',VO:'volcano',DR:'heat',WF:'heat'};
    return d.features.map(f=>{
      const p=f.properties||{};
      return {
        id:'gdacs_'+p.eventid,
        type:tm[p.eventtype]||'earthquake',
        name:p.name||p.eventtype,
        location:p.affectedcountries?.map(c=>c.countryname).join(', ')||'',
        lat:f.geometry?.coordinates?.[1]||0,
        lng:f.geometry?.coordinates?.[0]||0,
        severity:p.alertlevel==='Red'?'critical':p.alertlevel==='Orange'?'high':'medium',
        source:'GDACS',
        time:p.fromdate?.slice(0,10)||'',
        description:`${p.name} — ${p.alertlevel} alert`,
        sourceUrl:`https://gdacs.org/report.aspx?eventtype=${p.eventtype}&eventid=${p.eventid}`,
      };
    }).filter(e=>e.lat!==0);
  } catch{ return []; }
}

async function fetchAVO() {
  try {
    const txt = await fetch('https://www.avo.alaska.edu/feeds/recent_color.php').then(r=>r.text());
    return txt.trim().split('\n').slice(1).slice(0,20).map(l=>{
      const p=l.split(',');
      if(p.length<5) return null;
      return {
        id:'avo_'+p[0],type:'volcano',name:p[1]||'Alaska Volcano',
        location:'Alaska, USA',lat:parseFloat(p[3])||0,lng:parseFloat(p[4])||0,
        severity:p[2]==='RED'?'critical':p[2]==='ORANGE'?'high':p[2]==='YELLOW'?'medium':'low',
        source:'AVO',time:(p[5]||'').slice(0,10),
        description:`Alert level: ${p[2]} — ${p[1]}`,
        sourceUrl:'https://www.avo.alaska.edu/',
      };
    }).filter(e=>e&&e.lat!==0);
  } catch{ return []; }
}

// ─── SEISMIC PARSING ─────────────────────────────────────────
function parseGeoJSON(data, sourceLabel) {
  if(!data?.features) return [];
  return data.features.map(f=>{
    const p = f.properties||{};
    const mag = p.mag||p.magnitude||0;
    const coords = f.geometry?.coordinates||[];
    return {
      id: 'eq_'+p.code||p.id||p.eventID||Math.random(),
      type:'earthquake',
      name: p.place||p.flynn_region||`M${mag.toFixed(1)} earthquake`,
      location: p.place||p.flynn_region||'',
      lat: coords[1]||0,
      lng: coords[0]||0,
      severity: mag>=7?'critical':mag>=6?'high':mag>=5?'medium':'low',
      source: sourceLabel,
      time: new Date(p.time||p.date||Date.now()).toISOString().slice(0,10),
      description: `M${mag.toFixed(1)} — ${p.place||p.flynn_region||''}. Profundidade: ${(coords[2]||0).toFixed(0)}km`,
      sourceUrl: p.url||p.link||'',
      mag,
    };
  }).filter(e=>e.lat!==0 && e.lng!==0);
}

// ─── WEATHER PARSING ─────────────────────────────────────────
function parseWeather(data, city, country, heatThresh, coldThresh) {
  const cur = data?.current;
  if(!cur) return null;
  const temp = cur.temperature_2m;
  const wind = cur.wind_speed_10m||0;
  const precip = cur.precipitation||0;
  
  const events = [];
  
  if(temp >= heatThresh + 4) {
    events.push({
      id:`heat_${city.replace(/\s/g,'_')}`,type:'heat',
      name:`Onda de calor extremo — ${city}`,location:`${city}, ${country}`,
      lat:0,lng:0,severity:temp>=heatThresh+8?'critical':temp>=heatThresh+4?'high':'medium',
      source:'Open-Meteo',time:new Date().toISOString().slice(0,10),
      description:`${temp.toFixed(1)}°C agora em ${city}. ${wind>50?`Vento ${wind.toFixed(0)}km/h.`:''} ${precip>20?`Precipitação ${precip.toFixed(0)}mm.`:''}`,
      sourceUrl:'https://open-meteo.com',
    });
  } else if(temp <= coldThresh - 5) {
    events.push({
      id:`cold_${city.replace(/\s/g,'_')}`,type:'cold',
      name:`Onda de frio extremo — ${city}`,location:`${city}, ${country}`,
      lat:0,lng:0,severity:temp<=coldThresh-15?'critical':temp<=coldThresh-10?'high':'medium',
      source:'Open-Meteo',time:new Date().toISOString().slice(0,10),
      description:`${temp.toFixed(1)}°C agora em ${city}. ${wind>60?`Vento ${wind.toFixed(0)}km/h (wind chill extremo).`:''}`,
      sourceUrl:'https://open-meteo.com',
    });
  }
  
  if(wind >= 80) {
    events.push({
      id:`wind_${city.replace(/\s/g,'_')}`,type:'storm',
      name:`Ventos extremos — ${city}`,location:`${city}, ${country}`,
      lat:0,lng:0,severity:wind>=120?'critical':wind>=100?'high':'medium',
      source:'Open-Meteo',time:new Date().toISOString().slice(0,10),
      description:`Vento ${wind.toFixed(0)}km/h em ${city}. ${temp<0?`Temperatura ${temp.toFixed(1)}°C.`:''}`,
      sourceUrl:'https://open-meteo.com',
    });
  }
  
  return events;
}

// ─── AI FETCH ────────────────────────────────────────────────
async function fetchAI(query) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'claude-sonnet-4-20250514',
      max_tokens:2000,
      tools:[{type:'web_search_20250305',name:'web_search'}],
      system:AISYS,
      messages:[{role:'user',content:query.msg}],
    }),
  });
  const d = await r.json();
  const text = (d.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
  const m = text.match(/\[[\s\S]*?\]/);
  if(m) return JSON.parse(m[0]);
  return [];
}

// ─── MAIN PIPELINE ────────────────────────────────────────────
function post(type, data) { self.postMessage({type, data}); }

async function run() {
  post('status','started');

  // ── Phase 1: Seismic (fast APIs) ──────────────────────────
  post('phase',{id:'seismic',status:'loading'});
  const seismicResults = await Promise.allSettled(
    EQ_QUERIES.map(q => fetch(q.url).then(r=>r.json()).then(d=>parseGeoJSON(d,q.src)).catch(()=>[]))
  );
  const seismicEvents = seismicResults.flatMap(r=>r.value||[]);
  post('events', seismicEvents);
  post('phase',{id:'seismic',status:'ok'});

  // ── Phase 2: NASA + Humanitarian ──────────────────────────
  post('phase',{id:'nasa',status:'loading'});
  post('phase',{id:'noaa',status:'loading'});
  const [eonetR, reliefR, gdacsR, avoR] = await Promise.allSettled([
    fetchNASAEONET(), fetchReliefWeb(), fetchGDACS(), fetchAVO()
  ]);
  post('events', [
    ...(eonetR.value||[]), ...(reliefR.value||[]),
    ...(gdacsR.value||[]), ...(avoR.value||[]),
  ]);
  post('phase',{id:'nasa',status:'ok'});
  post('phase',{id:'noaa',status:'ok'});

  // ── Phase 3: Weather (200 cities in batches of 30) ────────
  post('phase',{id:'meteo',status:'loading'});
  const weatherEvents = [];
  const BATCH = 30;
  for(let i=0; i<CITIES.length; i+=BATCH) {
    const batch = CITIES.slice(i, i+BATCH);
    const results = await Promise.allSettled(batch.map(([lat,lng,name,country,ht,ct]) =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`)
        .then(r=>r.json())
        .then(d => {
          const evs = parseWeather(d, name, country, ht, ct);
          if(evs) evs.forEach(e=>{e.lat=lat;e.lng=lng;});
          return evs||[];
        })
        .catch(()=>[])
    ));
    const batchEvents = results.flatMap(r=>r.value||[]);
    if(batchEvents.length) {
      weatherEvents.push(...batchEvents);
      post('events', batchEvents);
    }
    // Small delay between batches to avoid rate limiting
    if(i+BATCH < CITIES.length) await new Promise(r=>setTimeout(r,200));
  }
  post('phase',{id:'meteo',status:'ok'});

  // ── Phase 4: AI Intelligence (parallel batches of 5) ─────
  const aiBatches = [];
  for(let i=0; i<AI_QUERIES.length; i+=5) aiBatches.push(AI_QUERIES.slice(i,i+5));
  
  let aiPhaseIdx = 0;
  const aiPhaseIds = ['volcoes','tempestades','calorfrio','enchentes','extra'];
  aiPhaseIds.forEach(id=>post('phase',{id,status:'loading'}));
  
  for(const batch of aiBatches) {
    const phaseId = aiPhaseIds[aiPhaseIdx % aiPhaseIds.length];
    const results = await Promise.allSettled(batch.map(q=>fetchAI(q).catch(()=>[])));
    const events = results.flatMap(r=>Array.isArray(r.value)?r.value:[]);
    if(events.length) post('events', events);
    post('phase',{id:phaseId,status:'ok'});
    aiPhaseIdx++;
    await new Promise(r=>setTimeout(r,500)); // rate limit buffer
  }

  post('status','done');
}

self.onmessage = function(e) {
  if(e.data.type==='start') run();
};
