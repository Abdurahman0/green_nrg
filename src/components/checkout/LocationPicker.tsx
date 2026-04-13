import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { LocationPoint } from '@/types';

type YMapClickEvent = {
  get: (key: 'coords') => number[] | undefined;
};

type YPlacemarkInstance = {
  geometry: {
    setCoordinates: (coords: [number, number]) => void;
  };
};

type YGeoObject = {
  properties: {
    get: (key: string) => string | undefined;
  };
  geometry: {
    getCoordinates: () => number[] | undefined;
  };
};

type YGeocodeResult = {
  geoObjects: {
    get: (index: number) => YGeoObject | undefined;
  };
};

type YMapInstance = {
  events: {
    add: (event: 'click', handler: (event: YMapClickEvent) => void) => void;
  };
  geoObjects: {
    add: (object: YPlacemarkInstance) => void;
  };
  setCenter: (coords: [number, number], zoom?: number, options?: { duration?: number }) => void;
  destroy: () => void;
};

type YMapsGlobal = {
  ready: (callback: () => void) => void;
  Map: new (
    element: HTMLElement,
    state: {
      center: [number, number];
      zoom: number;
      controls: string[];
    },
    options: { suppressMapOpenBlock: boolean }
  ) => YMapInstance;
  Placemark: new (
    coords: [number, number],
    properties: Record<string, unknown>,
    options: { preset: string }
  ) => YPlacemarkInstance;
  geocode: (
    request: string | [number, number],
    options?: { results?: number; kind?: 'house' | 'street' | 'locality' }
  ) => Promise<YGeocodeResult>;
};

const getYMaps = (): YMapsGlobal | null => (window as Window & { ymaps?: YMapsGlobal }).ymaps ?? null;

const toTuple = (coords: number[] | undefined): [number, number] | null => {
  if (!coords || coords.length < 2) return null;
  const first = Number(coords[0]);
  const second = Number(coords[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  return [first, second];
};

const roundCoord = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

async function reverseByNominatim(coords: [number, number], locale: 'uz' | 'ru') {
  const lang = locale === 'ru' ? 'ru' : 'uz';
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords[0]}&lon=${coords[1]}&accept-language=${lang}`,
    { headers: { Accept: 'application/json' } }
  );
  if (!response.ok) return '';
  const data = (await response.json()) as { display_name?: string };
  return (data.display_name ?? '').trim();
}

async function reverseGeocodeToAddress(
  ymaps: YMapsGlobal,
  coords: [number, number],
  locale: 'uz' | 'ru'
): Promise<string> {
  const extractText = (item: YGeoObject | undefined) => {
    const fromProps =
      item?.properties.get('text') ??
      item?.properties.get('name') ??
      item?.properties.get('description') ??
      item?.properties.get('metaDataProperty.GeocoderMetaData.text') ??
      '';
    return fromProps.trim();
  };

  const candidates: Array<[number, number]> = [
    coords,
    [roundCoord(coords[0], 4), roundCoord(coords[1], 4)],
    [roundCoord(coords[0], 3), roundCoord(coords[1], 3)],
  ];
  const kinds: Array<'house' | 'street' | 'locality'> = ['house', 'street', 'locality'];

  for (const candidate of candidates) {
    for (const kind of kinds) {
      let result: YGeocodeResult | null = null;
      try {
        result = await ymaps.geocode(candidate, { results: 3, kind });
      } catch {
        result = null;
      }
      if (!result) continue;
      for (let i = 0; i < 3; i += 1) {
        const text = extractText(result.geoObjects.get(i));
        if (text) return text;
      }
    }
  }

  try {
    return await reverseByNominatim(coords, locale);
  } catch {
    return '';
  }
}

export function LocationPicker({
  locale,
  title,
  hint,
  addressTitle,
  addressPlaceholder,
  actionLabel,
  pickedLabel,
  location,
  addressValue,
  onAddressChange,
  onSelectLocation,
  onPickLocation,
}: {
  locale: 'uz' | 'ru';
  title: string;
  hint: string;
  addressTitle: string;
  addressPlaceholder: string;
  actionLabel: string;
  pickedLabel: string;
  location: LocationPoint | null;
  addressValue: string;
  onAddressChange: (next: string) => void;
  onSelectLocation: (next: LocationPoint | null) => void;
  onPickLocation: () => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YMapInstance | null>(null);
  const placemarkRef = useRef<YPlacemarkInstance | null>(null);
  const lastGeocodedAddressRef = useRef('');
  const skipNextLocationSyncRef = useRef(false);
  const onSelectLocationRef = useRef(onSelectLocation);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  const resolveAddressAndFill = useCallback(
    async (coords: [number, number]) => {
      const ymaps = getYMaps();
      if (!ymaps) return;
      const text = await reverseGeocodeToAddress(ymaps, coords, locale);
      if (!text) return;
      // Only fill address when user hasn't typed something meaningful.
      if (addressValue.trim().length < 4) {
        onAddressChange(text);
      }
    },
    [addressValue, locale, onAddressChange]
  );

  useEffect(() => {
    let cancelled = false;

    const initializeMap = () => {
      const ymaps = getYMaps();
      if (!ymaps) {
        setMapError(true);
        return;
      }

      const initialCenter: [number, number] = location
        ? [location.latitude, location.longitude]
        : // Tashkent-ish default
          [41.2995, 69.2401];

      ymaps.ready(() => {
        if (cancelled) return;
        if (!mapContainerRef.current) return;

        const map = new ymaps.Map(
          mapContainerRef.current,
          { center: initialCenter, zoom: 12, controls: [] },
          { suppressMapOpenBlock: true }
        );

        map.events.add('click', (event) => {
          const coords = toTuple(event.get('coords'));
          if (!coords) return;

          if (!placemarkRef.current) {
            placemarkRef.current = new ymaps.Placemark(coords, {}, { preset: 'islands#greenDotIcon' });
            map.geoObjects.add(placemarkRef.current);
          } else {
            placemarkRef.current.geometry.setCoordinates(coords);
          }

          map.setCenter(coords, 15, { duration: 250 });
          skipNextLocationSyncRef.current = true;
          onSelectLocationRef.current({ latitude: coords[0], longitude: coords[1] });
          void resolveAddressAndFill(coords);
        });

        if (location) {
          placemarkRef.current = new ymaps.Placemark(
            [location.latitude, location.longitude],
            {},
            { preset: 'islands#greenDotIcon' }
          );
          map.geoObjects.add(placemarkRef.current);
          void resolveAddressAndFill([location.latitude, location.longitude]);
        }

        mapRef.current = map;
        setIsMapReady(true);
      });
    };

    const loadScript = () => {
      if (getYMaps()) {
        initializeMap();
        return;
      }

      const id = 'yandex-maps-sdk';
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        const lang = locale === 'ru' ? 'ru_RU' : 'uz_UZ';
        const apiKey = (import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined) ?? '';
        const apiKeyQuery = apiKey.trim() ? `&apikey=${encodeURIComponent(apiKey.trim())}` : '';
        script = document.createElement('script');
        script.id = id;
        script.src = `https://api-maps.yandex.ru/2.1/?lang=${lang}${apiKeyQuery}`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }

      script.addEventListener('load', initializeMap);
      script.addEventListener('error', () => setMapError(true));
      return () => {
        script?.removeEventListener('load', initializeMap);
      };
    };

    const cleanupScriptListeners = loadScript();

    return () => {
      cancelled = true;
      setIsMapReady(false);
      cleanupScriptListeners?.();
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        placemarkRef.current = null;
      }
    };
  }, [locale, location, resolveAddressAndFill]);

  useEffect(() => {
    if (!location || !mapRef.current || !isMapReady) return;
    if (skipNextLocationSyncRef.current) {
      skipNextLocationSyncRef.current = false;
      return;
    }

    const ymaps = getYMaps();
    if (!ymaps) return;
    const coords: [number, number] = [location.latitude, location.longitude];

    if (!placemarkRef.current) {
      placemarkRef.current = new ymaps.Placemark(coords, {}, { preset: 'islands#greenDotIcon' });
      mapRef.current.geoObjects.add(placemarkRef.current);
    } else {
      placemarkRef.current.geometry.setCoordinates(coords);
    }

    mapRef.current.setCenter(coords, 15, { duration: 250 });
    const timer = window.setTimeout(() => void resolveAddressAndFill(coords), 0);
    return () => window.clearTimeout(timer);
  }, [isMapReady, location, resolveAddressAndFill]);

  useEffect(() => {
    const query = addressValue.trim();
    if (query.length < 4 || !mapRef.current) return;
    const normalized = query.toLowerCase();
    if (normalized === lastGeocodedAddressRef.current) return;

    const ymaps = getYMaps();
    if (!ymaps) return;

    const timer = window.setTimeout(() => {
      void ymaps
        .geocode(query, { results: 1 })
        .then((result) => {
          const first = result.geoObjects.get(0);
          const coords = toTuple(first?.geometry.getCoordinates());
          if (!coords || !mapRef.current) return;

          if (!placemarkRef.current) {
            placemarkRef.current = new ymaps.Placemark(coords, {}, { preset: 'islands#greenDotIcon' });
            mapRef.current.geoObjects.add(placemarkRef.current);
          } else {
            placemarkRef.current.geometry.setCoordinates(coords);
          }

          mapRef.current.setCenter(coords, 15, { duration: 250 });
          onSelectLocationRef.current({ latitude: coords[0], longitude: coords[1] });
          lastGeocodedAddressRef.current = normalized;
        })
        .catch(() => setMapError(true));
    }, 450);

    return () => window.clearTimeout(timer);
  }, [addressValue]);

  return (
    <div className="p-4 bg-white rounded-3xl border border-gray-100 space-y-3">
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">{addressTitle}</p>
        <input
          value={addressValue}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={addressPlaceholder}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div
        ref={mapContainerRef}
        className="h-56 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
      />

      {location ? (
        <p className="text-xs text-primary font-semibold">
          {pickedLabel}: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </p>
      ) : null}

      {mapError ? <p className="text-xs text-red-600">{hint}</p> : null}

      <Button type="button" variant="secondary" className="w-full h-12 rounded-2xl" onClick={onPickLocation}>
        {actionLabel}
      </Button>
    </div>
  );
}

