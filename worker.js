// TerraWatch Data Worker v3 — 52+ fontes integradas
const TODAY = new Date().toISOString().slice(0,10)
const D7    = new Date(Date.now()-7*86400000).toISOString().slice(0,10)
const D30   = new Date(Date.now()-30*86400000).toISOString().slice(0,10)
const D90   = new Date(Date.now()-90*86400000).toISOString().slice(0,10)

const AISYS = `Você é o motor de dados do TerraWatch, monitor global de desastres em tempo real.
Use web_search para buscar eventos REAIS acontecendo AGORA (${TODAY}).
Retorne APENAS um array JSON puro, sem markdown, sem texto extra:
[{"id":"X","type":"earthquake|volcano|hurricane|cyclone|storm|flood|tsunami|heat|cold","name":"Nome oficial","location":"Cidade, País","lat":0.0,"lng":0.0,"severity":"critical|high|medium|low","source":"Nome da fonte","time":"YYYY-MM-DD","description":"Descrição factual com dados reais","sourceUrl":"https://...","mag":null}]
Regras: lat/lng obrigatórios e precisos. Apenas eventos com confirmação de fonte confiável. Mínimo 5, máximo 20 eventos por resposta.`

// ─── 200 CITIES ──────────────────────────────────────────────
const CITIES = [
  [64.84,-147.72,'Fairbanks','USA',30,-40],[61.22,-149.9,'Anchorage','USA',25,-30],
  [49.28,-123.12,'Vancouver','Canada',32,-20],[43.65,-79.38,'Toronto','Canada',33,-25],
  [45.5,-73.57,'Montreal','Canada',33,-25],[47.6,-122.33,'Seattle','USA',35,-15],
  [37.77,-122.42,'San Francisco','USA',38,-5],[34.05,-118.24,'Los Angeles','USA',38,-5],
  [33.45,-112.07,'Phoenix','USA',40,0],[36.17,-115.14,'Las Vegas','USA',40,0],
  [39.74,-104.98,'Denver','USA',35,-20],[41.85,-87.65,'Chicago','USA',33,-25],
  [40.71,-74.0,'New York','USA',36,-18],[42.36,-71.06,'Boston','USA',35,-20],
  [29.76,-95.37,'Houston','USA',40,-5],[32.78,-96.8,'Dallas','USA',40,-5],
  [25.77,-80.19,'Miami','USA',38,10],[38.9,-77.04,'Washington DC','USA',35,-15],
  [19.43,-99.13,'Mexico City','Mexico',32,5],[20.97,-89.62,'Merida','Mexico',40,15],
  [20.52,-86.95,'Cancun','Mexico',38,15],[9.93,-84.08,'San José','Costa Rica',33,5],
  [8.99,-79.52,'Panama City','Panama',35,15],[18.47,-69.95,'Santo Domingo','Dom. Rep.',36,15],
  [18.54,-72.34,'Port-au-Prince','Haiti',38,15],[23.13,-82.38,'Havana','Cuba',35,10],
  [10.48,-66.88,'Caracas','Venezuela',36,10],[0.22,-78.51,'Quito','Ecuador',25,5],
  [-12.05,-77.05,'Lima','Peru',28,5],[-16.5,-68.15,'La Paz','Bolivia',20,-5],
  [-33.45,-70.67,'Santiago','Chile',36,-10],[-34.61,-58.38,'Buenos Aires','Argentina',38,-15],
  [-23.55,-46.63,'São Paulo','Brazil',36,5],[-22.9,-43.17,'Rio de Janeiro','Brazil',38,10],
  [-3.1,-60.02,'Manaus','Brazil',38,15],[-15.78,-47.93,'Brasília','Brazil',38,5],
  [-8.05,-34.88,'Recife','Brazil',36,15],[-30.03,-51.23,'Porto Alegre','Brazil',36,-10],
  [-23.3,-51.17,'Londrina','Brazil',36,0],[-25.43,-49.27,'Curitiba','Brazil',33,-5],
  [-20.32,-40.34,'Vitória','Brazil',36,5],[-5.08,-42.8,'Teresina','Brazil',38,10],
  [-3.73,-38.52,'Fortaleza','Brazil',36,15],[-2.53,-44.3,'São Luís','Brazil',36,15],
  [-1.46,-48.5,'Belém','Brazil',34,15],[-43.3,-22.9,'Petrópolis','Brazil',30,5],
  [68.97,23.15,'Tromsø','Norway',20,-35],[59.91,10.75,'Oslo','Norway',30,-25],
  [59.33,18.07,'Stockholm','Sweden',30,-25],[60.17,24.94,'Helsinki','Finland',28,-30],
  [55.68,12.57,'Copenhagen','Denmark',30,-20],[52.52,13.41,'Berlin','Germany',36,-20],
  [48.86,2.35,'Paris','France',38,-10],[51.51,-0.13,'London','UK',36,-10],
  [53.33,-6.25,'Dublin','Ireland',30,-10],[52.23,21.01,'Warsaw','Poland',35,-25],
  [47.5,19.04,'Budapest','Hungary',37,-20],[48.21,16.37,'Vienna','Austria',36,-20],
  [47.38,8.54,'Zurich','Switzerland',35,-20],[45.46,9.19,'Milan','Italy',38,-10],
  [41.9,12.5,'Rome','Italy',38,-5],[37.98,23.73,'Athens','Greece',40,-5],
  [44.43,26.1,'Bucharest','Romania',38,-25],[40.41,-3.7,'Madrid','Spain',40,-5],
  [37.39,-5.98,'Seville','Spain',42,-3],[38.72,-9.14,'Lisbon','Portugal',38,-3],
  [55.75,37.62,'Moscow','Russia',30,-35],[59.95,30.32,'St. Petersburg','Russia',25,-30],
  [36.82,10.17,'Tunis','Tunisia',40,-5],[30.06,31.25,'Cairo','Egypt',42,0],
  [15.55,32.54,'Khartoum','Sudan',43,5],[12.37,43.15,'Djibouti','Djibouti',44,10],
  [13.52,2.12,'Niamey','Niger',43,10],[14.69,-17.44,'Dakar','Senegal',36,10],
  [-1.29,36.82,'Nairobi','Kenya',30,5],[9.03,38.74,'Addis Ababa','Ethiopia',25,5],
  [-4.32,15.32,'Kinshasa','DR Congo',34,10],[-8.84,13.23,'Luanda','Angola',36,10],
  [-25.97,32.57,'Maputo','Mozambique',36,5],[-18.91,47.54,'Antananarivo','Madagascar',30,5],
  [-33.93,18.42,'Cape Town','S. Africa',36,-5],[-26.2,28.04,'Johannesburg','S. Africa',35,-5],
  [41.01,28.96,'Istanbul','Turkey',38,-10],[39.93,32.86,'Ankara','Turkey',38,-20],
  [37.08,37.38,'Gaziantep','Turkey',38,-20],[31.95,35.95,'Amman','Jordan',38,-5],
  [33.34,44.4,'Baghdad','Iraq',43,0],[29.37,47.98,'Kuwait City','Kuwait',45,5],
  [24.69,46.72,'Riyadh','Saudi Arabia',44,5],[21.39,39.86,'Jeddah','Saudi Arabia',42,10],
  [25.29,51.53,'Doha','Qatar',42,10],[24.47,54.37,'Abu Dhabi','UAE',42,10],
  [35.7,51.42,'Tehran','Iran',38,-15],[33.72,73.04,'Islamabad','Pakistan',40,-5],
  [24.86,67.01,'Karachi','Pakistan',40,5],[28.61,77.23,'New Delhi','India',42,5],
  [19.08,72.88,'Mumbai','India',36,15],[22.57,88.36,'Kolkata','India',36,10],
  [13.08,80.28,'Chennai','India',38,15],[12.97,77.59,'Bangalore','India',33,5],
  [23.73,90.4,'Dhaka','Bangladesh',36,10],[27.71,85.31,'Kathmandu','Nepal',28,-10],
  [39.92,32.85,'Ankara','Turkey',38,-20],[41.3,69.27,'Tashkent','Uzbekistan',40,-15],
  [43.26,76.9,'Almaty','Kazakhstan',36,-30],[39.93,116.39,'Beijing','China',36,-20],
  [31.23,121.47,'Shanghai','China',36,-10],[23.13,113.26,'Guangzhou','China',36,0],
  [22.35,114.18,'Hong Kong','China',36,5],[25.05,121.53,'Taipei','Taiwan',35,5],
  [35.69,139.69,'Tokyo','Japan',35,-10],[34.69,135.5,'Osaka','Japan',35,-10],
  [43.06,141.35,'Sapporo','Japan',28,-20],[37.57,126.98,'Seoul','South Korea',33,-25],
  [21.03,105.85,'Hanoi','Vietnam',34,5],[10.82,106.63,'Ho Chi Minh','Vietnam',36,15],
  [13.75,100.52,'Bangkok','Thailand',38,15],[1.35,103.82,'Singapore','Singapore',34,20],
  [3.14,101.69,'Kuala Lumpur','Malaysia',34,15],[-6.21,106.85,'Jakarta','Indonesia',34,15],
  [-8.67,115.21,'Bali','Indonesia',34,15],[14.6,121.0,'Manila','Philippines',34,15],
  [-36.87,174.77,'Auckland','New Zealand',30,-5],[-41.29,174.78,'Wellington','New Zealand',28,-10],
  [-33.87,151.21,'Sydney','Australia',38,-5],[-37.82,144.97,'Melbourne','Australia',36,-10],
  [-27.47,153.03,'Brisbane','Australia',38,0],[-31.95,115.86,'Perth','Australia',40,0],
  [-12.46,130.84,'Darwin','Australia',38,10],[21.31,-157.86,'Honolulu','USA',32,15],
]

// ─── SEISMIC QUERIES ─────────────────────────────────────────
const EQ_QUERIES = [
  // USGS — 4 janelas de tempo/magnitude
  {id:'usgs_m7',  url:`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=7&starttime=${D90}&limit=50`,   src:'USGS M7+'},
  {id:'usgs_m6',  url:`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=6&starttime=${D30}&limit=100`,  src:'USGS M6+'},
  {id:'usgs_m5',  url:`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5&starttime=${D7}&limit=150`,   src:'USGS M5+'},
  {id:'usgs_m4',  url:`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.5&starttime=${D7}&limit=200`, src:'USGS M4.5+'},
  // EMSC (Europa/Mediterrâneo)
  {id:'emsc_m5',  url:`https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmagnitude=5&starttime=${D30}&limit=100`, src:'EMSC M5+'},
  {id:'emsc_m4',  url:`https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmagnitude=4&starttime=${D7}&limit=100`,  src:'EMSC M4+'},
  // INGV — Instituto Nazionale di Geofisica e Vulcanologia (Itália)
  {id:'ingv_m3',  url:`https://webservices.ingv.it/fdsnws/event/1/query?format=geojson&minmagnitude=3.5&starttime=${D7}&limit=100`, src:'INGV Itália'},
  // IRIS — rede sísmica global
  {id:'iris_m5',  url:`https://service.iris.edu/fdsnws/event/1/query?format=geojson&minmag=5&starttime=${D30}&limit=150`, src:'IRIS FDSN'},
  // GeoNet — Nova Zelândia
  {id:'geonet',   url:'https://api.geonet.org.nz/quake?MMI=3', src:'GeoNet NZ'},
  // AFAD — Turquia
  {id:'afad',     url:`https://deprem.afad.gov.tr/apiv2/event/filter?start=${D7}&end=${TODAY}&minmag=4&format=json`, src:'AFAD Turkey'},
  // SGC — Colômbia (FDSN)
  {id:'sgc',      url:`https://sgc.gov.co/sgcweb/fdsnws/event/1/query?format=geojson&minmagnitude=3.5&starttime=${D7}&limit=100`, src:'SGC Colômbia'},
]

// ─── AI QUERIES — 35 buscas direcionadas ─────────────────────
const AI_QUERIES = [
  // Vulcões
  {id:'ai_vol_pacific',   msg:`Consulte Smithsonian GVP (volcano.si.edu), USGS Volcano Hazards e VolcanoDiscovery para erupções ativas no Pacífico em ${TODAY}: Kilauea, Etna, Stromboli, Merapi, Krakatau, Taal, Mayon, Piton de la Fournaise. Array JSON.`},
  {id:'ai_vol_americas',  msg:`Consulte Smithsonian GVP, INGEOMINAS e observatórios locais para vulcões em alerta nas Américas em ${TODAY}: Popocatépetl, Tungurahua, Cotopaxi, Villarrica, Sabancaya, Ubinas, Colima. Array JSON.`},
  {id:'ai_vol_caribbean', msg:`Atividade vulcânica no Caribe e América Central em ${TODAY}: La Soufrière (St. Vincent), Soufrière Hills (Montserrat), Santa Ana, Arenal, Poás, Rincón de la Vieja. Fonte: GVP/OVSICORI. Array JSON.`},
  {id:'ai_vol_indonesia', msg:`Erupções vulcânicas na Indonésia em ${TODAY}: Merapi, Sinabung, Semeru, Anak Krakatau, Ruang, Ibu, Marapi. Fonte: PVMBG (magma.esdm.go.id), Darwin VAAC. Array JSON.`},
  // Sismos com danos
  {id:'ai_eq_asia',       msg:`Terremotos M5.5+ com danos confirmados na Ásia em ${TODAY}: Japão (JMA), Taiwan (CWA), Filipinas (PHIVOLCS), Indonésia (BMKG), Papua Nova Guiné. Array JSON com sourceUrl das agências.`},
  {id:'ai_eq_mideast',    msg:`Terremotos M4.5+ com danos no Oriente Médio e Ásia Central em ${TODAY}: Turquia (AFAD/Kandilli), Irão (IRSC), Afeganistão, Paquistão, Nepal (NSC). Array JSON.`},
  {id:'ai_eq_americas',   msg:`Terremotos M5+ nas Américas em ${TODAY}: Peru (IGP), Chile (CSN), Equador (IGEPN), Colômbia (SGC), América Central (RSN), México (SSN). Array JSON com sourceUrl.`},
  {id:'ai_eq_europe',     msg:`Terremotos M3.5+ com danos ou sentidos pela população na Europa em ${TODAY}: Itália (INGV), Grécia (NOA), Turquia, Balcãs, Ibéria. Array JSON.`},
  // Ciclones tropicais
  {id:'ai_tc_active',     msg:`Ciclones tropicais, tufões ou furacões ativos em ${TODAY} em QUALQUER oceano. Consulte NOAA NHC (nhc.noaa.gov), JTWC, RSMC Tokyo, BOM Austrália, IMD New Delhi. Inclua categoria, ventos, posição atual. Array JSON.`},
  {id:'ai_tc_pacific',    msg:`Tempestades tropicais ativas no Pacífico Norte Oriental, Pacífico Sul e Oceano Índico em ${TODAY}. Fontes: JTWC, Météo-France La Réunion, Fiji Met Service. Array JSON.`},
  {id:'ai_tc_atlantic',   msg:`Sistemas tropicais ativos no Atlântico Norte e Mar do Caribe em ${TODAY}. Fonte: NOAA NHC (nhc.noaa.gov). Array JSON.`},
  // Enchentes
  {id:'ai_flood_asia',    msg:`Enchentes graves na Ásia em ${TODAY}. Consulte FloodList (floodlist.com), GDACS (gdacs.org), ReliefWeb, Dartmouth Flood Observatory. Bangladesh, Myanmar, Tailândia, Vietnã, Índia, Indonésia. Array JSON.`},
  {id:'ai_flood_africa',  msg:`Inundações na África em ${TODAY}. Fontes: FloodList, GDACS, ReliefWeb OCHA, Copernicus EMS (emergency.copernicus.eu). Moçambique, Madagascar, Quênia, Sudão, DRC. Array JSON.`},
  {id:'ai_flood_americas',msg:`Enchentes nas Américas em ${TODAY}. Fontes: GDACS, Dartmouth Flood Observatory (floodobservatory.colorado.edu), ReliefWeb, CEMADEN/ANA (Brasil), Defesa Civil BR. Array JSON.`},
  {id:'ai_flood_europe',  msg:`Inundações e chuvas extremas na Europa em ${TODAY}. Fontes: Copernicus EMS, GloFAS (globalfloods.eu), ECMWF, serviços meteorológicos nacionais. Array JSON.`},
  // Calor extremo
  {id:'ai_heat_global',   msg:`Ondas de calor extremo (>40°C) ativas em ${TODAY}. Fontes: Copernicus C3S, WMO, NOAA CPC (cpc.ncep.noaa.gov), ECMWF. Oriente Médio, Sul da Ásia, Norte da África, Austrália. Array JSON.`},
  {id:'ai_heat_asia',     msg:`Calor extremo na Índia, Paquistão, Bangladesh em ${TODAY}: mortes por calor, alertas do IMD. Fontes: IMD, WMO, ReliefWeb. Array JSON.`},
  // Frio extremo
  {id:'ai_cold_global',   msg:`Ondas de frio extremo e nevascas em ${TODAY}: blizzards, colapso de infraestrutura. Fontes: NOAA CPC, WMO, Copernicus C3S, serviços nacionais. Array JSON.`},
  // Incêndios
  {id:'ai_wildfire',      msg:`Incêndios florestais graves ativos em ${TODAY} (type=heat). Fontes: INPE BDQueimadas (queimadas.dgi.inpe.br), FIRMS NASA, Copernicus EFFIS. América do Sul, Austrália, Mediterrâneo. Array JSON.`},
  {id:'ai_wildfire_br',   msg:`Incêndios no Brasil em ${TODAY} com impacto (evacuações, mortes, área >1000ha). Fontes: INPE (queimadas.dgi.inpe.br), IBAMA, CEMADEN, Defesa Civil (s2id.mi.gov.br). Array JSON type=heat.`},
  // Tsunamis
  {id:'ai_tsunami',       msg:`Alertas de tsunami ou ondas observadas em ${TODAY}. Fontes: PTWC (tsunami.gov), JMA, NTHMP, IOC-UNESCO. Pacífico, Atlântico, Índico. Array JSON.`},
  // Tempestades severas
  {id:'ai_storm_eu',      msg:`Tempestades severas e ciclones extratropicais na Europa em ${TODAY}. Fontes: ECMWF, Météo-France, DWD, Met Office, ESWD (eswd.eu). Danos, mortes. Array JSON.`},
  {id:'ai_storm_us',      msg:`Tempestades severas, tornados e granizo nos EUA em ${TODAY}. Fontes: NWS SPC (spc.noaa.gov), Storm Prediction Center, NHC. Array JSON.`},
  {id:'ai_storm_asia',    msg:`Tempestades de areia, monções e tempestades severas na Ásia em ${TODAY}. Fontes: IMD, JMA, CWB Taiwan, WMO. Array JSON.`},
  // Brasil e regionais
  {id:'ai_brazil',        msg:`Todos os desastres naturais no Brasil em ${TODAY}: enchentes, deslizamentos, seca, chuvas extremas. Fontes: CEMADEN (cemaden.gov.br), INMET, Defesa Civil S2iD, CPTEC/INPE, ANA (snirh.gov.br). Array JSON.`},
  {id:'ai_brazil_ne',     msg:`Desastres no Nordeste e Norte do Brasil em ${TODAY}: seca, enchentes repentinas, tempestades. Fontes: CEMADEN, FUNCEME, INMET estações regionais. Array JSON.`},
  // Crises humanitárias + desastre natural
  {id:'ai_hum_africa',    msg:`Crises humanitárias com desastre natural na África em ${TODAY}: seca, inundações, epidemias climáticas. Fontes: ReliefWeb (reliefweb.int/disasters), OCHA, FEWS NET. Array JSON.`},
  {id:'ai_hum_asia',      msg:`Crises humanitárias com desastre natural na Ásia em ${TODAY}: Myanmar, Afeganistão, Paquistão. Fontes: ReliefWeb, OCHA, GDACS. Array JSON.`},
  // Geo/deslizamentos
  {id:'ai_geo',           msg:`Deslizamentos, avalanches e subsidências com vítimas em ${TODAY}. Fontes: ReliefWeb, GDACS, Copernicus EMS, EM-DAT (emdat.be). Array JSON type=flood.`},
  // Secas
  {id:'ai_drought',       msg:`Secas críticas em ${TODAY}. Fontes: FEWS NET (fews.net), WMO, NOAA CPC, World Bank Climate API, EM-DAT. Sahel, Chifre da África, Mediterrâneo, América do Sul. Array JSON type=heat.`},
  // Pacifico/Anel de Fogo
  {id:'ai_pacific_ring',  msg:`Eventos sísmicos e vulcânicos no Anel de Fogo do Pacífico em ${TODAY}. Fontes: USGS, GeoNet NZ, PHIVOLCS, BMKG Indonésia, JMA, PVMBG. Array JSON.`},
  {id:'ai_oceania',       msg:`Desastres naturais na Oceania em ${TODAY}: Austrália (BOM), Nova Zelândia (GeoNet), ilhas do Pacífico (SPC), Vanuatu, Tonga, Fiji. Array JSON.`},
  {id:'ai_south_america', msg:`Todos os desastres naturais na América do Sul em ${TODAY}. Fontes: USGS, IGEPN Equador, IGP Peru, CSN Chile, INPRES Argentina, SGC Colômbia, CEMADEN Brasil. Array JSON.`},
  {id:'ai_central_asia',  msg:`Desastres naturais na Ásia Central e Cáucaso em ${TODAY}: Cazaquistão, Quirguistão, Tajiquistão, Azerbaijão, Geórgia, Armênia. Fontes: USGS, EMSC, ReliefWeb. Array JSON.`},
]

// ─── FETCH HELPERS ───────────────────────────────────────────
async function fetchNASAEONET() {
  const cats = ['volcanoes','severeStorms','earthquakes','floods','wildfires']
  const res = await Promise.allSettled(cats.map(c =>
    fetch(`https://eonet.gsfc.nasa.gov/api/v3/events?category=${c}&days=30&status=open&limit=50`)
      .then(r=>r.json())
  ))
  return res.flatMap(r => {
    if(r.status!=='fulfilled'||!r.value?.events) return []
    return r.value.events.map(e => {
      const geo = e.geometries?.[0]; if(!geo) return null
      const c = geo.coordinates
      const tmap = {Volcanoes:'volcano',Earthquakes:'earthquake','Severe Storms':'storm',Floods:'flood',Wildfires:'heat'}
      return {
        id:'eonet_'+e.id, type:tmap[e.categories?.[0]?.title]||'storm',
        name:e.title, location:e.title,
        lat:Array.isArray(c[0])?c[0][1]:c[1], lng:Array.isArray(c[0])?c[0][0]:c[0],
        severity:'medium', source:'NASA EONET',
        time:geo.date?.slice(0,10)||'',
        description:e.title, sourceUrl:e.sources?.[0]?.url||'https://eonet.gsfc.nasa.gov',
      }
    }).filter(Boolean)
  })
}

async function fetchReliefWeb() {
  const queries = [
    {q:'earthquake',type:'earthquake'},{q:'flood',type:'flood'},
    {q:'tropical+cyclone',type:'hurricane'},{q:'volcano',type:'volcano'},
    {q:'drought',type:'heat'},{q:'landslide',type:'flood'},
    {q:'tsunami',type:'tsunami'},{q:'cold+wave',type:'cold'},
    {q:'heat+wave',type:'heat'},{q:'wildfire',type:'heat'},
  ]
  const res = await Promise.allSettled(queries.map(({q,type}) =>
    fetch(`https://api.reliefweb.int/v1/disasters?appname=terrawatch&filter[conditions][0][field]=status&filter[conditions][0][value]=ongoing&filter[conditions][1][field]=type.name&filter[conditions][1][value]=${q}&fields[include][]=name&fields[include][]=country&fields[include][]=date&fields[include][]=url&limit=10&sort[]=date.created:desc`)
      .then(r=>r.json())
      .then(d=>(d.data||[]).map(e=>({
        id:'rw_'+e.id, type,
        name:e.fields.name,
        location:(e.fields.country||[]).map(c=>c.name).join(', ')||'Global',
        lat:e.fields.country?.[0]?.location?.lat||0,
        lng:e.fields.country?.[0]?.location?.lon||0,
        severity:'high', source:'ReliefWeb OCHA',
        time:e.fields.date?.event?.slice(0,10)||'',
        description:e.fields.name,
        sourceUrl:e.fields.url||'https://reliefweb.int/disasters',
      })))
  ))
  return res.flatMap(r=>r.status==='fulfilled'?r.value:[])
}

async function fetchGDACS() {
  try {
    const d = await fetch(`https://gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromdate=${D30}&todate=${TODAY}&alertlevel=Green;Orange;Red&eventlist=EQ;TC;FL;VO;DR;WF&limit=150`)
      .then(r=>r.json())
    if(!d?.features) return []
    const tm={EQ:'earthquake',TC:'hurricane',FL:'flood',VO:'volcano',DR:'heat',WF:'heat',TS:'tsunami'}
    return d.features.map(f=>{
      const p=f.properties||{}
      return {
        id:'gdacs_'+p.eventid, type:tm[p.eventtype]||'earthquake',
        name:p.name||p.eventtype,
        location:(p.affectedcountries||[]).map(c=>c.countryname).join(', ')||'',
        lat:f.geometry?.coordinates?.[1]||0, lng:f.geometry?.coordinates?.[0]||0,
        severity:p.alertlevel==='Red'?'critical':p.alertlevel==='Orange'?'high':'medium',
        source:'GDACS / UN',
        time:p.fromdate?.slice(0,10)||'',
        description:`${p.name||p.eventtype} — GDACS alert ${p.alertlevel}. ${p.episodealertlevel?`Episode: ${p.episodealertlevel}.`:''}`,
        sourceUrl:`https://gdacs.org/report.aspx?eventtype=${p.eventtype}&eventid=${p.eventid}`,
      }
    }).filter(e=>e.lat!==0)
  } catch{ return [] }
}

async function fetchAVO() {
  try {
    const txt = await fetch('https://www.avo.alaska.edu/feeds/recent_color.php').then(r=>r.text())
    return txt.trim().split('\n').slice(1).slice(0,20).map(l=>{
      const p=l.split(','); if(p.length<5) return null
      return {
        id:'avo_'+p[0], type:'volcano', name:p[1]||'Alaska Volcano',
        location:'Alaska, USA', lat:parseFloat(p[3])||0, lng:parseFloat(p[4])||0,
        severity:p[2]==='RED'?'critical':p[2]==='ORANGE'?'high':p[2]==='YELLOW'?'medium':'low',
        source:'AVO', time:(p[5]||'').slice(0,10),
        description:`Alert level: ${p[2]} — ${p[1]}`,
        sourceUrl:'https://www.avo.alaska.edu/',
      }
    }).filter(e=>e&&e.lat!==0)
  } catch{ return [] }
}

async function fetchNHC() {
  // NOAA NHC — sistemas tropicais ativos
  try {
    const d = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json').then(r=>r.json())
    const storms = d?.activeStorms||[]
    return storms.map(s=>({
      id:'nhc_'+s.id, type:s.classification?.includes('Hurricane')?'hurricane':'cyclone',
      name:`${s.name} (${s.classification})`,
      location:`${s.basinName} — ${s.publicAdvisory?.headline||''}`.slice(0,80),
      lat:parseFloat(s.centerLocLatitude||0), lng:parseFloat(s.centerLocLongitude||0),
      severity:parseInt(s.intensity||0)>=64?'critical':parseInt(s.intensity||0)>=34?'high':'medium',
      source:'NOAA NHC', time:TODAY,
      description:`${s.name}: ventos max ${s.intensity||'?'}kt, pressão ${s.minimumPressure||'?'}mb. ${s.publicAdvisory?.headline||''}`.slice(0,200),
      sourceUrl:`https://www.nhc.noaa.gov/text/refresh/MIAT${s.id}+shtml/`,
    })).filter(e=>e.lat!==0)
  } catch{ return [] }
}

async function fetchUSGSVolcano() {
  // USGS Volcano Hazards Program — status de vulcões nos EUA
  try {
    const d = await fetch('https://volcanoes.usgs.gov/hans-public/api/volcanoStatus').then(r=>r.json())
    return (d||[])
      .filter(v=>v.alertLevel&&v.alertLevel!=='Normal'&&v.alertLevel!=='Unassigned')
      .map(v=>({
        id:'usgsvol_'+v.vNum, type:'volcano',
        name:v.name||'US Volcano',
        location:`${v.state||''}, USA`,
        lat:parseFloat(v.latitude||0), lng:parseFloat(v.longitude||0),
        severity:v.alertLevel==='Warning'?'critical':v.alertLevel==='Watch'?'high':'medium',
        source:'USGS Volcano Hazards',
        time:TODAY,
        description:`${v.name}: Aviation Color Code ${v.aviationColorCode||'?'}, Alert Level ${v.alertLevel}`,
        sourceUrl:`https://www.usgs.gov/volcanoes/${(v.name||'').toLowerCase().replace(/\s/g,'-')}`,
      })).filter(e=>e.lat!==0)
  } catch{ return [] }
}

async function fetchINPEQueimadas() {
  // INPE BDQueimadas — focos de incêndio no Brasil (últimos 3 dias, todos satélites)
  try {
    const url = `https://queimadas.dgi.inpe.br/api/focos/?pais_id=33&estado_id=&municipio_id=&satelite=&bioma=&dias_anteriores=3&formato=json`
    const d = await fetch(url).then(r=>r.json())
    if(!Array.isArray(d)||!d.length) return []
    // Group by state
    const byState = {}
    d.forEach(f=>{
      const k=f.municipio||f.estado||'Brasil'
      if(!byState[k]) byState[k]={count:0,lat:f.latitude,lng:f.longitude,estado:f.estado||''}
      byState[k].count++
    })
    return Object.entries(byState)
      .filter(([,v])=>v.count>50) // só clusters significativos
      .sort((a,b)=>b[1].count-a[1].count)
      .slice(0,15)
      .map(([mun,v])=>({
        id:`inpe_fire_${mun.replace(/\s/g,'_')}`,
        type:'heat', name:`Incêndios — ${mun}`,
        location:`${mun}, ${v.estado}, Brasil`,
        lat:parseFloat(v.lat)||0, lng:parseFloat(v.lng)||0,
        severity:v.count>500?'critical':v.count>200?'high':'medium',
        source:'INPE BDQueimadas',
        time:TODAY,
        description:`${v.count} focos de incêndio detectados por satélite nos últimos 3 dias em ${mun}.`,
        sourceUrl:'https://queimadas.dgi.inpe.br/queimadas/bdqueimadas',
      }))
  } catch{ return [] }
}

async function fetchCEMADEN() {
  // CEMADEN — alertas de risco hidrológico/geológico no Brasil
  try {
    const d = await fetch('https://sjc.salvar.cemaden.gov.br/resources/graficos/interativo/getPCD.php?uf=BR&tipo=10&inicio=0&fim=0')
      .then(r=>r.json())
    if(!d?.length) return []
    return d
      .filter(e=>e.statusRisco==='alto'||e.statusRisco==='muitoAlto')
      .slice(0,20)
      .map(e=>({
        id:'cemaden_'+e.codEstacao,
        type:'flood', name:`Alerta ${e.tipoEstacao||'Hidrológico'} — ${e.nomeMunicipio}`,
        location:`${e.nomeMunicipio}, ${e.nomeEstado}, Brasil`,
        lat:parseFloat(e.latitude||0), lng:parseFloat(e.longitude||0),
        severity:e.statusRisco==='muitoAlto'?'critical':'high',
        source:'CEMADEN',
        time:TODAY,
        description:`Risco ${e.statusRisco} em ${e.nomeMunicipio}/${e.nomeEstado}. Estação: ${e.nomeEstacao||''}.`,
        sourceUrl:'https://www.cemaden.gov.br/mapainterativo/',
      }))
  } catch{ return [] }
}

// ─── SEISMIC PARSE ───────────────────────────────────────────
function parseGeoJSON(data, src) {
  if(!data?.features) return []
  return data.features.map(f=>{
    const p=f.properties||{}, c=f.geometry?.coordinates||[]
    const mag=p.mag||p.magnitude||p.ml||p.mw||0
    return {
      id:'eq_'+(p.code||p.id||p.eventID||p.evid||Math.random().toString(36).slice(2)),
      type:'earthquake',
      name:p.place||p.flynn_region||p.region||`M${(+mag).toFixed(1)} earthquake`,
      location:p.place||p.flynn_region||p.region||'',
      lat:c[1]||0, lng:c[0]||0,
      severity:mag>=7?'critical':mag>=6?'high':mag>=5?'medium':'low',
      source:src,
      time:new Date(p.time||p.date||p.origintime||Date.now()).toISOString().slice(0,10),
      description:`M${(+mag).toFixed(1)} — ${p.place||p.flynn_region||p.region||''}. Profundidade: ${((c[2]||p.depth||0)+0).toFixed(0)}km`,
      sourceUrl:p.url||p.link||'',
      mag:+mag||0,
    }
  }).filter(e=>e.lat!==0&&e.lng!==0)
}

// ─── WEATHER PARSE ───────────────────────────────────────────
function parseWeather(data, city, country, ht, ct) {
  const cur=data?.current; if(!cur) return []
  const temp=cur.temperature_2m, wind=cur.wind_speed_10m||0, precip=cur.precipitation||0
  const evs=[]
  if(temp>=ht+4)
    evs.push({id:`heat_${city.replace(/\s/g,'_')}`,type:'heat',name:`Onda de calor — ${city}`,location:`${city}, ${country}`,lat:0,lng:0,
      severity:temp>=ht+8?'critical':temp>=ht+4?'high':'medium',source:'Open-Meteo',time:TODAY,
      description:`${temp.toFixed(1)}°C em ${city}.${wind>50?` Vento ${wind.toFixed(0)}km/h.`:''}${precip>20?` Precipitação ${precip.toFixed(0)}mm.`:''}`,
      sourceUrl:'https://open-meteo.com'})
  if(temp<=ct-5)
    evs.push({id:`cold_${city.replace(/\s/g,'_')}`,type:'cold',name:`Onda de frio — ${city}`,location:`${city}, ${country}`,lat:0,lng:0,
      severity:temp<=ct-15?'critical':temp<=ct-10?'high':'medium',source:'Open-Meteo',time:TODAY,
      description:`${temp.toFixed(1)}°C em ${city}.${wind>60?` Wind chill extremo: vento ${wind.toFixed(0)}km/h.`:''}`,
      sourceUrl:'https://open-meteo.com'})
  if(wind>=80)
    evs.push({id:`wind_${city.replace(/\s/g,'_')}`,type:'storm',name:`Ventos extremos — ${city}`,location:`${city}, ${country}`,lat:0,lng:0,
      severity:wind>=120?'critical':wind>=100?'high':'medium',source:'Open-Meteo',time:TODAY,
      description:`Vento ${wind.toFixed(0)}km/h em ${city}.`,
      sourceUrl:'https://open-meteo.com'})
  return evs
}

// ─── AI FETCH ────────────────────────────────────────────────
async function fetchAI(q) {
  const r = await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'claude-sonnet-4-20250514', max_tokens:2000,
      tools:[{type:'web_search_20250305',name:'web_search'}],
      system:AISYS,
      messages:[{role:'user',content:q.msg}],
    }),
  })
  const d=await r.json()
  const text=(d.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('')
  const m=text.match(/\[[\s\S]*?\]/)
  if(m) return JSON.parse(m[0])
  return []
}

// ─── MAIN PIPELINE ───────────────────────────────────────────
function post(type,data){self.postMessage({type,data})}

async function run() {
  post('status','started')

  // ── FASE 1: Sísmica (USGS, EMSC, INGV, IRIS, GeoNet, AFAD, SGC) ──
  post('phase',{id:'seismic',status:'loading'})
  const seisRes = await Promise.allSettled(
    EQ_QUERIES.map(q=>fetch(q.url).then(r=>r.json()).then(d=>parseGeoJSON(d,q.src)).catch(()=>[]))
  )
  post('events', seisRes.flatMap(r=>r.value||[]))
  post('phase',{id:'seismic',status:'ok'})

  // ── FASE 2: NASA + GDACS + ReliefWeb + NHC + USGS Volcano ──
  post('phase',{id:'nasa',status:'loading'})
  post('phase',{id:'noaa',status:'loading'})
  const [eonet,relief,gdacs,avo,nhc,usgsvol] = await Promise.allSettled([
    fetchNASAEONET(), fetchReliefWeb(), fetchGDACS(), fetchAVO(),
    fetchNHC(), fetchUSGSVolcano(),
  ])
  post('events',[
    ...(eonet.value||[]), ...(relief.value||[]), ...(gdacs.value||[]),
    ...(avo.value||[]), ...(nhc.value||[]), ...(usgsvol.value||[]),
  ])
  post('phase',{id:'nasa',status:'ok'})
  post('phase',{id:'noaa',status:'ok'})

  // ── FASE 3: Brasil — INPE + CEMADEN ──
  post('phase',{id:'extra',status:'loading'})
  const [inpe,cemaden] = await Promise.allSettled([fetchINPEQueimadas(), fetchCEMADEN()])
  post('events',[...(inpe.value||[]), ...(cemaden.value||[])])
  post('phase',{id:'extra',status:'ok'})

  // ── FASE 4: Open-Meteo 200 cidades (batches de 30) ──
  post('phase',{id:'meteo',status:'loading'})
  const BATCH=30
  for(let i=0;i<CITIES.length;i+=BATCH) {
    const batch=CITIES.slice(i,i+BATCH)
    const res=await Promise.allSettled(batch.map(([lat,lng,name,country,ht,ct])=>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`)
        .then(r=>r.json())
        .then(d=>{const evs=parseWeather(d,name,country,ht,ct);evs.forEach(e=>{e.lat=lat;e.lng=lng});return evs})
        .catch(()=>[])
    ))
    const evs=res.flatMap(r=>r.value||[])
    if(evs.length) post('events',evs)
    if(i+BATCH<CITIES.length) await new Promise(r=>setTimeout(r,150))
  }
  post('phase',{id:'meteo',status:'ok'})

  // ── FASE 5: IA — 35 buscas em lotes de 5 ──
  const aiPhaseIds=['volcoes','tempestades','calorfrio','enchentes','extra']
  aiPhaseIds.forEach(id=>post('phase',{id,status:'loading'}))
  const batches=[]
  for(let i=0;i<AI_QUERIES.length;i+=5) batches.push(AI_QUERIES.slice(i,i+5))
  let pi=0
  for(const batch of batches) {
    const res=await Promise.allSettled(batch.map(q=>fetchAI(q).catch(()=>[])))
    const evs=res.flatMap(r=>Array.isArray(r.value)?r.value:[])
    if(evs.length) post('events',evs)
    post('phase',{id:aiPhaseIds[pi%aiPhaseIds.length],status:'ok'})
    pi++
    await new Promise(r=>setTimeout(r,400))
  }

  post('status','done')
}

self.onmessage = e => { if(e.data.type==='start') run() }
