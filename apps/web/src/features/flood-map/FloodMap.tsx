import { useRef, useCallback, useState, useEffect } from 'react'
import Map, { Layer, Source, NavigationControl, type MapRef, type MapMouseEvent } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useZones, useSensors } from './hooks/useMapData'
import { useMapStore } from '../../stores/useMapStore'
import { useUIStore } from '../../stores/useUIStore'
import { LayerControls } from './LayerControls'
import { ZoneTooltip } from './ZoneTooltip'
import { JGC_CENTER, JGC_ZOOM, RISK_FILL_COLORS } from '../../constants/flood'
import type { FloodZone, RiskLevel } from '@flood-jgc/shared'
import type { GeoJSON } from 'geojson'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark'

export function FloodMap() {
  const mapRef = useRef<MapRef>(null)
  const { data: zonesData } = useZones()
  const { data: sensorsData } = useSensors()
  const { selectedZoneId, hoveredZoneId, activeFilters, showSensors, setSelectedZone, setHoveredZone } = useMapStore()
  const { setSelectedSensor } = useUIStore()
  const [tooltip, setTooltip] = useState<{ zone: FloodZone; x: number; y: number } | null>(null)

  useEffect(() => {
    return () => {
      mapRef.current?.getMap()?.remove()
    }
  }, [])

  const zonesGeoJSON: GeoJSON = {
    type: 'FeatureCollection',
    features: (zonesData?.zones ?? [])
      .filter((z) => activeFilters.has(z.riskLevel as RiskLevel))
      .map((z) => ({
        type: 'Feature',
        id: z.id,
        geometry: z.geometry,
        properties: {
          id: z.id,
          name: z.name,
          riskLevel: z.riskLevel,
          riskScore: z.riskScore,
          fillColor: RISK_FILL_COLORS[z.riskLevel as RiskLevel],
          isSelected: z.id === selectedZoneId,
          isHovered: z.id === hoveredZoneId,
        },
      })),
  }

  const sensorsGeoJSON: GeoJSON = {
    type: 'FeatureCollection',
    features: (sensorsData?.sensors ?? []).map((s) => ({
      type: 'Feature',
      id: s.id,
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      properties: {
        id: s.id,
        label: s.label,
        status: s.currentStatus,
        color: s.currentStatus === 'critical' ? '#ef4444' : s.currentStatus === 'warning' ? '#f97316' : '#22c55e',
      },
    })),
  }

  const onMouseMove = useCallback((e: MapMouseEvent) => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const features = map.queryRenderedFeatures(e.point, { layers: ['zones-fill'] })
    if (features.length > 0) {
      const props = features[0].properties as { id: string }
      setHoveredZone(props.id)
      const zone = zonesData?.zones.find((z) => z.id === props.id)
      if (zone) {
        setTooltip({ zone, x: e.point.x, y: e.point.y })
      }
      map.getCanvas().style.cursor = 'pointer'
    } else {
      setHoveredZone(null)
      setTooltip(null)
      map.getCanvas().style.cursor = ''
    }
  }, [zonesData, setHoveredZone])

  const onMouseLeave = useCallback(() => {
    setHoveredZone(null)
    setTooltip(null)
    mapRef.current?.getMap()?.getCanvas().style.cursor !== undefined &&
      (mapRef.current.getMap().getCanvas().style.cursor = '')
  }, [setHoveredZone])

  const onClick = useCallback((e: MapMouseEvent) => {
    const map = mapRef.current?.getMap()
    if (!map) return

    const sensorFeatures = map.queryRenderedFeatures(e.point, { layers: ['sensors-circle'] })
    if (sensorFeatures.length > 0) {
      const props = sensorFeatures[0].properties as { id: string }
      setSelectedSensor(props.id)
      return
    }

    const zoneFeatures = map.queryRenderedFeatures(e.point, { layers: ['zones-fill'] })
    if (zoneFeatures.length > 0) {
      const props = zoneFeatures[0].properties as { id: string }
      setSelectedZone(props.id === selectedZoneId ? null : props.id)
    } else {
      setSelectedZone(null)
    }
  }, [selectedZoneId, setSelectedZone, setSelectedSensor])

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: JGC_CENTER[0],
          latitude:  JGC_CENTER[1],
          zoom:      JGC_ZOOM,
        }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />

        <Source id="zones" type="geojson" data={zonesGeoJSON}>
          <Layer
            id="zones-fill"
            type="fill"
            paint={{
              'fill-color': ['get', 'fillColor'],
              'fill-opacity': [
                'case',
                ['==', ['get', 'isSelected'], true], 0.85,
                ['==', ['get', 'isHovered'],  true], 0.75,
                0.55,
              ],
            }}
          />
          <Layer
            id="zones-outline"
            type="line"
            paint={{
              'line-color': ['get', 'fillColor'],
              'line-width': [
                'case',
                ['==', ['get', 'isSelected'], true], 3,
                ['==', ['get', 'isHovered'],  true], 2,
                1,
              ],
              'line-opacity': 0.9,
            }}
          />
          <Layer
            id="zones-label"
            type="symbol"
            layout={{
              'text-field': ['concat', ['get', 'name'], '\n', ['to-string', ['get', 'riskScore']]],
              'text-size': 10,
              'text-anchor': 'center',
              'text-max-width': 10,
            }}
            paint={{
              'text-color': '#f1f5f9',
              'text-halo-color': '#0f1117',
              'text-halo-width': 1,
            }}
          />
        </Source>

        {showSensors && (
          <Source id="sensors" type="geojson" data={sensorsGeoJSON}>
            <Layer
              id="sensors-circle"
              type="circle"
              paint={{
                'circle-color': ['get', 'color'],
                'circle-radius': 6,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#0f1117',
                'circle-opacity': 0.9,
              }}
            />
          </Source>
        )}
      </Map>

      <LayerControls />

      {tooltip && (
        <ZoneTooltip zone={tooltip.zone} x={tooltip.x} y={tooltip.y} />
      )}
    </div>
  )
}
