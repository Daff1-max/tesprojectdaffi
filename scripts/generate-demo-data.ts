import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = path.join(__dirname, '../apps/api/src/data')

const CLUSTER_NAMES = [
  'Anggrek','Bougenville','Cempaka','Dahlia','Edelweis',
  'Flamboyan','Gardenia','Heliconia','Iris','Jasmine',
  'Kenanga','Lili','Melati','Nusa Indah','Orchid',
  'Palm Hill','Queens','Rosewood','Seruni','Tulip',
  'Umbrella Tree','Violet','Wisteria','Xanthe','Yucca',
]

const BOUNDS = { west: 106.9350, east: 106.9600, south: -6.2200, north: -6.1950 }
const COLS = 5, ROWS = 5
const CELL_W = (BOUNDS.east - BOUNDS.west) / COLS
const CELL_H = (BOUNDS.north - BOUNDS.south) / ROWS

function makePolygon(col: number, row: number): [number,number][][] {
  const pad = 0.0015
  return [[
    [BOUNDS.west + col*CELL_W + pad,      BOUNDS.south + row*CELL_H + pad],
    [BOUNDS.west + (col+1)*CELL_W - pad,  BOUNDS.south + row*CELL_H + pad],
    [BOUNDS.west + (col+1)*CELL_W - pad,  BOUNDS.south + (row+1)*CELL_H - pad],
    [BOUNDS.west + col*CELL_W + pad,      BOUNDS.south + (row+1)*CELL_H - pad],
    [BOUNDS.west + col*CELL_W + pad,      BOUNDS.south + row*CELL_H + pad],
  ]]
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function rnd(lo: number, hi: number) { return lo + Math.random() * (hi - lo) }
function normalize(v: number, lo: number, hi: number, invert = false) {
  return clamp((invert ? 1 - (v-lo)/(hi-lo) : (v-lo)/(hi-lo)), 0, 1) * 100
}
function calcRisk(el: number, dr: number, fr: number, pop: number) {
  const s = Math.round(
    normalize(el,0,15,true)*0.30 + normalize(dr,0,100,true)*0.25 +
    normalize(fr,0,5)*0.25      + normalize(pop,0,5000)*0.20
  )
  return { score: s, level: s<=25?'low':s<=50?'medium':s<=75?'high':'critical' }
}
function isNearWater(col: number, row: number) { return col >= 3 || row <= 1 }

function generateZones() {
  return CLUSTER_NAMES.map((name, i) => {
    const col = i % COLS, row = Math.floor(i / COLS)
    const nw = isNearWater(col, row)
    const elevation = nw ? rnd(2.5,6) : rnd(5,12)
    const drainage  = nw ? rnd(30,65) : rnd(55,95)
    const freq      = nw ? rnd(1.5,4.5) : rnd(0,1.5)
    const pop       = Math.round(rnd(500,4500))
    const { score, level } = calcRisk(elevation, drainage, freq, pop)
    return {
      id: `JGC-Z${String(i+1).padStart(2,'0')}`,
      name: `Cluster ${name}`,
      riskLevel: level, riskScore: score,
      elevationMeters: Math.round(elevation*10)/10,
      drainageCapacityPercent: Math.round(drainage),
      populationEstimate: pop,
      lastFloodDate: new Date(Date.now() - rnd(30,800)*86400000).toISOString(),
      floodFrequencyPerYear: Math.round(freq*10)/10,
      area: Math.round(CELL_W*CELL_H*111000*111000*100)/100,
      geometry: { type: 'Polygon' as const, coordinates: makePolygon(col, row) },
      description: `Klaster hunian di bagian ${col<=2?'barat':'timur'} JGC.`,
    }
  })
}

// ← Hanya simpan METADATA sensor, bukan readings (readings di-generate on-the-fly di API)
function generateSensors(zones: ReturnType<typeof generateZones>) {
  const sensors: object[] = []
  let sid = 1
  for (const zone of zones) {
    const count = zone.riskLevel==='critical'?3:zone.riskLevel==='high'?2:1
    const poly = zone.geometry.coordinates[0]
    const lngMin = Math.min(...poly.map(p=>p[0])), lngMax = Math.max(...poly.map(p=>p[0]))
    const latMin = Math.min(...poly.map(p=>p[1])), latMax = Math.max(...poly.map(p=>p[1]))
    for (let i = 0; i < count; i++) {
      const status = zone.riskLevel==='critical'&&i===0?'critical'
        :zone.riskLevel==='high'&&i===0?'warning'
        :Math.random()<0.15?'warning':'normal'
      const baseWater = status==='critical'?rnd(80,150):status==='warning'?rnd(40,80):rnd(5,40)
      const blockage  = status==='critical'?rnd(60,95):status==='warning'?rnd(30,60):rnd(0,30)
      const flow      = status==='critical'?rnd(0.5,3):rnd(3,15)
      sensors.push({
        id: `SEN-${String(sid++).padStart(3,'0')}`,
        zoneId: zone.id,
        lat: rnd(latMin,latMax), lng: rnd(lngMin,lngMax),
        label: `Sensor Drainase ${i+1} - ${zone.name}`,
        currentStatus: status,
        // Base values for on-the-fly reading generation
        baseWaterLevelCm: Math.round(baseWater*10)/10,
        baseBlockagePercent: Math.round(blockage),
        baseFlowRate: Math.round(flow*10)/10,
        lastReading: {
          timestamp: new Date().toISOString(),
          waterLevelCm: Math.round(baseWater*10)/10,
          flowRateLitersPerSecond: Math.round(flow*10)/10,
          blockagePercent: Math.round(blockage),
          status,
        },
      })
    }
  }
  return sensors
}

function generateFloodEvents(zones: ReturnType<typeof generateZones>) {
  return [
    { id:'EVT-001', date:'2024-01-24T06:00:00.000Z', durationHours:18, maxDepthCm:145, avgDepthCm:82, affectedZoneIds:zones.filter(z=>['critical','high'].includes(z.riskLevel)).slice(0,8).map(z=>z.id), rainfallMmPerDay:187, estimatedLossMillionRupiah:2450, evacuees:1340, cause:'Hujan ekstrem 3 hari berturut-turut + kapasitas Kali Sunter penuh', notes:'Banjir terbesar sejak 2020' },
    { id:'EVT-002', date:'2023-12-02T04:30:00.000Z', durationHours:9, maxDepthCm:75, avgDepthCm:40, affectedZoneIds:zones.filter(z=>['critical','high'].includes(z.riskLevel)).slice(0,5).map(z=>z.id), rainfallMmPerDay:130, estimatedLossMillionRupiah:870, evacuees:560, cause:'Rob tinggi + hujan deras sore' },
    { id:'EVT-003', date:'2023-02-10T08:00:00.000Z', durationHours:12, maxDepthCm:95, avgDepthCm:55, affectedZoneIds:zones.filter(z=>z.riskLevel!=='low').slice(0,6).map(z=>z.id), rainfallMmPerDay:155, estimatedLossMillionRupiah:1200, evacuees:780, cause:'Drainase tersumbat + curah hujan tinggi' },
    { id:'EVT-004', date:'2022-11-27T03:00:00.000Z', durationHours:6, maxDepthCm:50, avgDepthCm:28, affectedZoneIds:zones.filter(z=>z.riskLevel==='critical').map(z=>z.id), rainfallMmPerDay:98, estimatedLossMillionRupiah:320, evacuees:210, cause:'Saluran drainase utama penuh kapasitas' },
    { id:'EVT-005', date:'2022-02-19T05:30:00.000Z', durationHours:24, maxDepthCm:170, avgDepthCm:100, affectedZoneIds:zones.slice(0,14).map(z=>z.id), rainfallMmPerDay:220, estimatedLossMillionRupiah:4100, evacuees:2800, cause:'Banjir kiriman dari hulu + hujan lokal intensitas tinggi', notes:'Status tanggap darurat diaktifkan' },
    { id:'EVT-006', date:'2021-10-04T10:00:00.000Z', durationHours:8, maxDepthCm:65, avgDepthCm:35, affectedZoneIds:zones.filter(z=>z.riskLevel!=='low').slice(0,4).map(z=>z.id), rainfallMmPerDay:112, estimatedLossMillionRupiah:450, evacuees:330, cause:'Saluran tersumbat sampah pasca hari raya' },
    { id:'EVT-007', date:'2020-12-22T02:00:00.000Z', durationHours:30, maxDepthCm:195, avgDepthCm:120, affectedZoneIds:zones.map(z=>z.id), rainfallMmPerDay:260, estimatedLossMillionRupiah:6800, evacuees:5400, cause:'Banjir besar tahunan — musim hujan puncak La Niña', notes:'Seluruh kawasan JGC terdampak' },
    { id:'EVT-008', date:'2019-07-13T07:00:00.000Z', durationHours:5, maxDepthCm:40, avgDepthCm:20, affectedZoneIds:zones.filter(z=>z.riskLevel==='critical').map(z=>z.id), rainfallMmPerDay:85, estimatedLossMillionRupiah:180, evacuees:90, cause:'Genangan lokal akibat penyumbatan drainase' },
  ]
}

function main() {
  console.log('Generating demo data...')
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  const zones = generateZones()
  fs.writeFileSync(path.join(DATA_DIR,'zones.json'), JSON.stringify(zones, null, 2))
  console.log(`✓ ${zones.length} zones`)
  const sensors = generateSensors(zones)
  fs.writeFileSync(path.join(DATA_DIR,'sensors.json'), JSON.stringify(sensors, null, 2))
  console.log(`✓ ${sensors.length} sensors (metadata only, no readings)`)
  const events = generateFloodEvents(zones)
  fs.writeFileSync(path.join(DATA_DIR,'flood-events.json'), JSON.stringify(events, null, 2))
  console.log(`✓ ${events.length} flood events`)
}
main()
