/// <reference types="google.maps" />
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  Search,
  Send,
  Store,
  X,
} from 'lucide-react';

export interface LatLngPoint {
  lat: number;
  lng: number;
}

interface StockistPlace {
  id: string;
  name: string;
  address: string;
  location: LatLngPoint;
  rating?: number;
  businessStatus?: string;
  googleMapsURI?: string;
}

interface RouteSummary {
  distanceMeters: number;
  durationMillis: number;
  travelMode: 'DRIVING' | 'WALKING';
}

interface GroundingMapLink {
  title: string;
  uri: string;
  reviewSnippets?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  mapsLinks?: GroundingMapLink[];
  error?: boolean;
}

const MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';

const STORE_CATEGORIES = [
  { id: 'health', label: 'Health & Organic', query: 'health food store organic market', primaryTypes: ['grocery_store', 'supermarket'] },
  { id: 'grocery', label: 'Natural Grocers', query: 'natural grocery store whole foods', primaryTypes: ['grocery_store', 'supermarket'] },
  { id: 'cafe', label: 'Cafes & Fitness', query: 'specialty coffee juice bar fitness', primaryTypes: ['cafe', 'coffee_shop'] },
] as const;

type StoreCategoryId = (typeof STORE_CATEGORIES)[number]['id'];

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: unknown; status?: unknown })?.code ?? (err as { status?: unknown })?.status;
  return (
    code === 429 ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('Quota') ||
    msg.includes('OverQuotaMapError')
  );
}

function dispatchQuotaExceeded() {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
}

function extractLatLng(loc: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined): LatLngPoint | null {
  if (!loc) return null;
  if (typeof (loc as google.maps.LatLng).lat === 'function') {
    const ll = loc as google.maps.LatLng;
    return { lat: ll.lat(), lng: ll.lng() };
  }
  const lit = loc as google.maps.LatLngLiteral;
  if (typeof lit.lat === 'number' && typeof lit.lng === 'number') {
    return { lat: lit.lat, lng: lit.lng };
  }
  return null;
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '—';
  const miles = meters / 1609.34;
  return miles >= 0.2 ? `${miles.toFixed(1)} mi` : `${Math.round(meters)} m`;
}

function formatDuration(millis: number): string {
  if (!Number.isFinite(millis) || millis <= 0) return '—';
  const mins = Math.max(1, Math.round(millis / 60000));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}

/* ==================== STOCKIST MARKER WITH INFOWINDOW ANCHOR ==================== */
function StockistMarker({
  place,
  selected,
  accentColor,
  onSelect,
}: {
  place: StockistPlace;
  selected: boolean;
  accentColor: string;
  onSelect: (place: StockistPlace, marker: google.maps.marker.AdvancedMarkerElement | null) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <AdvancedMarker
      ref={markerRef}
      position={place.location}
      title={place.name}
      zIndex={selected ? 1000 : 10}
      onClick={() => onSelect(place, marker)}
    >
      <Pin
        background={selected ? '#1c1a1f' : accentColor}
        borderColor="#fbf7f2"
        glyphColor="#fbf7f2"
        scale={selected ? 1.2 : 1}
      />
    </AdvancedMarker>
  );
}

/* ==================== ROUTE OVERLAY USING ROUTES API ==================== */
function RouteOverlay({
  origin,
  destination,
  travelMode,
  onRouteResult,
  onRouteError,
}: {
  origin: LatLngPoint | null;
  destination: LatLngPoint | null;
  travelMode: 'DRIVING' | 'WALKING';
  onRouteResult: (summary: RouteSummary | null) => void;
  onRouteError: (msg: string | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onRouteResult(null);
    onRouteError(null);

    if (!routesLib || !map || !origin || !destination) return;

    let cancelled = false;
    const request: google.maps.routes.ComputeRoutesRequest = {
      origin,
      destination,
      travelMode: travelMode as google.maps.TravelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    (routesLib.Route as typeof google.maps.routes.Route)
      .computeRoutes(request)
      .then((res) => {
        if (cancelled) return;
        const primaryRoute = res.routes?.[0];
        if (!primaryRoute) {
          onRouteError('No route found between your starting point and this store.');
          return;
        }
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#1c1a1f',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 48);
        }

        onRouteResult({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
          travelMode,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isQuotaError(err)) {
          dispatchQuotaExceeded();
        }
        onRouteError(err instanceof Error ? err.message : 'Unable to compute route right now.');
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin, destination, travelMode, onRouteResult, onRouteError]);

  return null;
}

/* ==================== STORE LOCATOR INNER CONTENT ==================== */
function StoreLocatorInner({
  accentColor,
  onClose,
  onAskChatAboutStores,
}: {
  accentColor: string;
  onClose: () => void;
  onAskChatAboutStores: (locationText: string) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const coreLib = useMapsLibrary('core');
  const apiStatus = useApiLoadingStatus();

  const [queryInput, setQueryInput] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [category, setCategory] = useState<StoreCategoryId>('health');
  const [searchAnchor, setSearchAnchor] = useState<LatLngPoint | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngPoint | null>(null);
  const [anchorLabel, setAnchorLabel] = useState<string>('');

  const [places, setPlaces] = useState<StockistPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<StockistPlace | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const [showRoute, setShowRoute] = useState(false);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING'>('DRIVING');
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch autocomplete suggestions cleanly with session token
  useEffect(() => {
    if (!placesLib || queryInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }
        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: queryInput.trim(),
          sessionToken: sessionTokenRef.current,
          includedPrimaryTypes: ['locality', 'postal_code', 'sublocality', 'neighborhood', 'street_address'],
        });
        if (!cancelled) {
          setSuggestions(res.suggestions.slice(0, 5));
        }
      } catch (err) {
        if (isQuotaError(err)) dispatchQuotaExceeded();
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, queryInput]);

  const fitMapToPlaces = useCallback(
    (found: StockistPlace[], fallbackCenter?: LatLngPoint | null) => {
      if (!map) return;
      if (coreLib && found.length > 0) {
        const bounds = new coreLib.LatLngBounds();
        found.forEach((p) => bounds.extend(p.location));
        if (userLocation) bounds.extend(userLocation);
        map.fitBounds(bounds, 48);
      } else if (fallbackCenter) {
        map.panTo(fallbackCenter);
        map.setZoom(13);
      }
    },
    [map, coreLib, userLocation],
  );

  const runNearbySearch = useCallback(
    async (center: LatLngPoint, catId: StoreCategoryId, label: string) => {
      if (!placesLib) return;
      setLoadingPlaces(true);
      setErrorMsg(null);
      setShowRoute(false);
      setRouteSummary(null);
      setSelectedPlace(null);
      setInfoOpen(false);

      const cat = STORE_CATEGORIES.find((c) => c.id === catId) ?? STORE_CATEGORIES[0];

      try {
        const { Place, SearchNearbyRankPreference } = placesLib;
        const { places: rawPlaces } = await Place.searchNearby({
          fields: ['displayName', 'location', 'formattedAddress', 'businessStatus', 'rating', 'googleMapsURI'],
          locationRestriction: {
            center,
            radius: 8000,
          },
          includedPrimaryTypes: [...cat.primaryTypes],
          maxResultCount: 10,
          rankPreference: SearchNearbyRankPreference.DISTANCE,
          language: 'en-US',
          region: 'us',
        });

        const parsed: StockistPlace[] = rawPlaces
          .map((p) => {
            const loc = extractLatLng(p.location);
            if (!loc) return null;
            return {
              id: p.id,
              name: p.displayName || 'Local Stockist',
              address: p.formattedAddress || 'Address unavailable',
              location: loc,
              rating: typeof p.rating === 'number' ? p.rating : undefined,
              businessStatus: p.businessStatus || undefined,
              googleMapsURI: p.googleMapsURI || undefined,
            } as StockistPlace;
          })
          .filter((x): x is StockistPlace => x !== null);

        setSearchAnchor(center);
        setAnchorLabel(label);
        setPlaces(parsed);
        if (parsed.length > 0) {
          setSelectedPlace(parsed[0]);
        }
        fitMapToPlaces(parsed, center);
      } catch (err) {
        if (isQuotaError(err)) dispatchQuotaExceeded();
        setErrorMsg(
          err instanceof Error
            ? `Store lookup error: ${err.message}`
            : 'Unable to fetch nearby stores right now.',
        );
      } finally {
        setLoadingPlaces(false);
      }
    },
    [placesLib, fitMapToPlaces],
  );

  const runTextSearch = useCallback(
    async (areaText: string, catId: StoreCategoryId, explicitCenter?: LatLngPoint | null) => {
      if (!placesLib) return;
      const trimmed = areaText.trim();
      if (!trimmed && !explicitCenter) return;

      setLoadingPlaces(true);
      setErrorMsg(null);
      setSuggestions([]);
      setShowRoute(false);
      setRouteSummary(null);
      setSelectedPlace(null);
      setInfoOpen(false);

      const cat = STORE_CATEGORIES.find((c) => c.id === catId) ?? STORE_CATEGORIES[0];
      const textQuery = trimmed ? `${cat.query} in ${trimmed}` : cat.query;

      try {
        const { Place } = placesLib;
        const { places: rawPlaces } = await Place.searchByText({
          textQuery,
          fields: ['displayName', 'location', 'formattedAddress', 'businessStatus', 'rating', 'googleMapsURI'],
          ...(explicitCenter ? { locationBias: explicitCenter } : {}),
          maxResultCount: 10,
          language: 'en-US',
          region: 'us',
        });

        const parsed: StockistPlace[] = rawPlaces
          .map((p) => {
            const loc = extractLatLng(p.location);
            if (!loc) return null;
            return {
              id: p.id,
              name: p.displayName || 'Local Stockist',
              address: p.formattedAddress || 'Address unavailable',
              location: loc,
              rating: typeof p.rating === 'number' ? p.rating : undefined,
              businessStatus: p.businessStatus || undefined,
              googleMapsURI: p.googleMapsURI || undefined,
            } as StockistPlace;
          })
          .filter((x): x is StockistPlace => x !== null);

        const nextAnchor = explicitCenter ?? parsed[0]?.location ?? null;
        if (nextAnchor) setSearchAnchor(nextAnchor);
        setAnchorLabel(trimmed || 'Selected area');
        setPlaces(parsed);
        if (parsed.length > 0) {
          setSelectedPlace(parsed[0]);
        }
        fitMapToPlaces(parsed, nextAnchor);
      } catch (err) {
        if (isQuotaError(err)) dispatchQuotaExceeded();
        setErrorMsg(
          err instanceof Error
            ? `Store search error: ${err.message}`
            : 'Unable to search stores in that area.',
        );
      } finally {
        setLoadingPlaces(false);
      }
    },
    [placesLib, fitMapToPlaces],
  );

  const handleSelectSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      const label = suggestion.placePrediction.text.text;
      setQueryInput(label);
      setSuggestions([]);
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['location', 'formattedAddress', 'displayName'],
        });
        sessionTokenRef.current = null;
        const loc = extractLatLng(place.location);
        if (loc) {
          await runTextSearch(place.formattedAddress || label, category, loc);
        } else {
          await runTextSearch(label, category);
        }
      } catch (err) {
        if (isQuotaError(err)) dispatchQuotaExceeded();
        await runTextSearch(label, category);
      }
    },
    [placesLib, category, runTextSearch],
  );

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser. Search a city or zip code instead.');
      return;
    }
    setLocating(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LatLngPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setLocating(false);
        void runNearbySearch(coords, category, 'Your current location');
      },
      (geoErr) => {
        setLocating(false);
        setErrorMsg(
          geoErr.code === geoErr.PERMISSION_DENIED
            ? 'Location permission was denied. Enter a city or zip code above to find stores.'
            : 'Unable to determine your location right now. Try searching a city or neighborhood.',
        );
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 60000 },
    );
  }, [category, runNearbySearch]);

  const handleCategoryChange = useCallback(
    (nextCat: StoreCategoryId) => {
      setCategory(nextCat);
      if (userLocation && anchorLabel === 'Your current location') {
        void runNearbySearch(userLocation, nextCat, 'Your current location');
      } else if (anchorLabel) {
        void runTextSearch(anchorLabel, nextCat, searchAnchor);
      }
    },
    [userLocation, anchorLabel, searchAnchor, runNearbySearch, runTextSearch],
  );

  const handleSelectPlace = useCallback(
    (place: StockistPlace, markerEl?: google.maps.marker.AdvancedMarkerElement | null) => {
      setSelectedPlace(place);
      if (markerEl) {
        setSelectedMarker(markerEl);
        setInfoOpen(true);
      }
      if (map) {
        map.panTo(place.location);
      }
    },
    [map],
  );

  const routeOrigin = userLocation ?? searchAnchor;

  const isAuthError =
    !MAPS_API_KEY ||
    apiStatus === APILoadingStatus.AUTH_FAILURE ||
    apiStatus === APILoadingStatus.FAILED;

  return (
    <div className="locator-modal" role="dialog" aria-modal="true" aria-labelledby="locator-title">
      {/* Header */}
      <div className="locator-header" style={{ background: accentColor }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#1c1a1f] text-[#f0e8e0] flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="nutri-mono text-[11px] uppercase tracking-[0.14em] text-[#1c1a1f]/80">
              Retail Stockist Finder
            </div>
            <h2 id="locator-title" className="disp text-xl sm:text-2xl m-0 text-[#fbf7f2]">
              FIND JACKIE SWEETS NEAR YOU
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#1c1a1f] text-[#f0e8e0] border-0 flex items-center justify-center cursor-pointer shrink-0 hover:opacity-90"
          aria-label="Close store locator"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-black/10 space-y-3 bg-[#f0e8e0]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runTextSearch(queryInput, category);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#1c1a1f]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search city, neighborhood, or postal code (e.g. Austin, TX)"
              aria-label="Search city or neighborhood"
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-black/20 bg-white text-sm text-[#1c1a1f] outline-none focus:border-[#1c1a1f]"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-black/15 shadow-xl z-20 list-none p-1.5 m-0 max-h-52 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => void handleSelectSuggestion(s)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm text-[#1c1a1f] hover:bg-[#f0e8e0] border-0 bg-transparent cursor-pointer flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      <span className="truncate">{s.placePrediction?.text.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loadingPlaces || !queryInput.trim() || !placesLib}
              className="px-5 py-2.5 rounded-full bg-[#1c1a1f] text-[#f0e8e0] text-xs sm:text-sm font-semibold border-0 cursor-pointer disabled:opacity-45 whitespace-nowrap"
            >
              {loadingPlaces ? 'Searching…' : 'Search Area'}
            </button>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating || !placesLib}
              className="px-4 py-2.5 rounded-full border border-[#1c1a1f]/25 bg-white text-[#1c1a1f] text-xs sm:text-sm font-semibold cursor-pointer hover:bg-black/5 inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-45"
            >
              {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
              <span>Use my location</span>
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Retailer categories">
            {STORE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                  category === cat.id
                    ? 'bg-[#1c1a1f] text-[#f0e8e0] border-[#1c1a1f]'
                    : 'bg-white/75 text-[#1c1a1f] border-black/15 hover:bg-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {!anchorLabel && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="nutri-mono opacity-65">Try:</span>
              {['Austin, TX', 'Brooklyn, NY', 'San Francisco, CA'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setQueryInput(city);
                    void runTextSearch(city, category);
                  }}
                  disabled={!placesLib}
                  className="nutri-mono px-2.5 py-1 rounded-full bg-black/5 hover:bg-black/10 border-0 text-[#1c1a1f] cursor-pointer"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-amber-100 border border-amber-300 px-3.5 py-2 text-xs text-amber-950">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Main Split: Interactive Map + Results */}
      {isAuthError ? (
        <div className="p-8 text-center space-y-2 bg-[#f7f1ea]">
          <p className="text-sm font-semibold text-[#1c1a1f] m-0">
            Google Maps could not initialize right now.
          </p>
          <p className="text-xs text-[#1c1a1f]/75 m-0">
            Check that your Google Maps API key is active, or ask our AI Support Chat for store recommendations nearby.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onAskChatAboutStores(queryInput || 'near me');
            }}
            className="mt-2 px-4 py-2 rounded-full bg-[#1c1a1f] text-[#f0e8e0] text-xs font-semibold border-0 cursor-pointer"
          >
            Ask Support Chat instead
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Map Container — explicit height (CF2) + mapId (CF9) + internalUsageAttributionIds */}
          <div className="md:col-span-7 relative h-[320px] sm:h-[420px] w-full bg-[#e4dcd2]">
            <GoogleMap
              defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
              defaultZoom={4}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              streetViewControl={false}
              mapTypeControl={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              {userLocation && (
                <AdvancedMarker position={userLocation} title="Your location" zIndex={1200}>
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" />
                </AdvancedMarker>
              )}

              {places.map((p) => (
                <StockistMarker
                  key={p.id}
                  place={p}
                  selected={selectedPlace?.id === p.id}
                  accentColor={accentColor}
                  onSelect={(placeObj, markerEl) => handleSelectPlace(placeObj, markerEl)}
                />
              ))}

              {infoOpen && selectedPlace && selectedMarker && (
                <InfoWindow anchor={selectedMarker} onCloseClick={() => setInfoOpen(false)}>
                  <div className="p-1 max-w-[230px] text-[#1c1a1f]">
                    <div className="font-bold text-sm leading-snug">{selectedPlace.name}</div>
                    <div className="text-xs opacity-80 mt-0.5">{selectedPlace.address}</div>
                    {selectedPlace.rating !== undefined && (
                      <div className="text-xs font-medium mt-1">Rating: {selectedPlace.rating.toFixed(1)} ★</div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {routeOrigin && (
                        <button
                          type="button"
                          onClick={() => setShowRoute(true)}
                          className="px-2.5 py-1 rounded-full bg-[#1c1a1f] text-[#f0e8e0] text-[11px] font-semibold border-0 cursor-pointer"
                        >
                          Directions
                        </button>
                      )}
                      {selectedPlace.googleMapsURI && (
                        <a
                          href={selectedPlace.googleMapsURI}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-[#1c1a1f] underline inline-flex items-center gap-1"
                        >
                          Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}

              {showRoute && routeOrigin && selectedPlace && (
                <RouteOverlay
                  origin={routeOrigin}
                  destination={selectedPlace.location}
                  travelMode={travelMode}
                  onRouteResult={setRouteSummary}
                  onRouteError={setRouteError}
                />
              )}
            </GoogleMap>
          </div>

          {/* Results List */}
          <div className="md:col-span-5 max-h-[340px] sm:max-h-[420px] overflow-y-auto bg-[#fbf7f2] p-4 space-y-3 border-t md:border-t-0 md:border-l border-black/10">
            <div className="flex items-center justify-between gap-2">
              <div className="nutri-mono text-[11px] uppercase tracking-[0.12em] text-[#1c1a1f]/70">
                {anchorLabel ? `Results near ${anchorLabel}` : 'Search a location to see stockists'}
              </div>
              {places.length > 0 && (
                <span className="nutri-mono text-[11px] text-[#1c1a1f]/60">{places.length} found</span>
              )}
            </div>

            {selectedPlace && routeOrigin && (
              <div className="rounded-xl bg-[#f0e8e0] p-3 border border-black/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold truncate">Route to {selectedPlace.name}</span>
                  <div className="inline-flex rounded-full bg-white p-0.5 border border-black/10">
                    {(['DRIVING', 'WALKING'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setTravelMode(mode);
                          setShowRoute(true);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border-0 cursor-pointer ${
                          travelMode === mode ? 'bg-[#1c1a1f] text-[#f0e8e0]' : 'bg-transparent text-[#1c1a1f]/70'
                        }`}
                      >
                        {mode === 'DRIVING' ? 'Drive' : 'Walk'}
                      </button>
                    ))}
                  </div>
                </div>
                {showRoute && routeSummary ? (
                  <div className="nutri-mono text-xs text-[#1c1a1f]">
                    {formatDistance(routeSummary.distanceMeters)} · {formatDuration(routeSummary.durationMillis)} ({routeSummary.travelMode.toLowerCase()})
                  </div>
                ) : routeError ? (
                  <div className="text-xs text-red-700">{routeError}</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRoute(true)}
                    className="w-full py-1.5 rounded-full bg-[#1c1a1f] text-[#f0e8e0] text-xs font-semibold border-0 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Show {travelMode.toLowerCase()} directions</span>
                  </button>
                )}
              </div>
            )}

            {loadingPlaces ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-xs text-[#1c1a1f]/70">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Looking up natural grocers and stockists…</span>
              </div>
            ) : places.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-[#1c1a1f]/75 leading-relaxed m-0">
                  Enter any city, neighborhood, or click <strong>Use my location</strong> to find local health food markets and specialty grocers.
                </p>
                <p className="nutri-mono text-[11px] text-[#1c1a1f]/55 m-0">
                  Stock varies by store — call ahead to confirm flavours in stock.
                </p>
              </div>
            ) : (
              <ul className="list-none p-0 m-0 space-y-2">
                {places.map((p) => {
                  const isSel = selectedPlace?.id === p.id;
                  return (
                    <li key={p.id}>
                      <div
                        className={`rounded-xl p-3 border transition-colors cursor-pointer ${
                          isSel
                            ? 'bg-[#f0e8e0] border-[#1c1a1f]'
                            : 'bg-white border-black/10 hover:border-black/30'
                        }`}
                        onClick={() => handleSelectPlace(p)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-[#1c1a1f] leading-snug">{p.name}</span>
                          {p.rating !== undefined && (
                            <span className="nutri-mono text-[11px] shrink-0 text-[#1c1a1f]/80">
                              {p.rating.toFixed(1)}★
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#1c1a1f]/75 mt-1 mb-2 leading-snug">{p.address}</p>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlace(p);
                              setShowRoute(true);
                              if (map) map.panTo(p.location);
                            }}
                            className="text-[11px] font-semibold text-[#1c1a1f] bg-black/5 hover:bg-black/10 px-2.5 py-1 rounded-full border-0 cursor-pointer inline-flex items-center gap-1"
                          >
                            <Navigation className="w-3 h-3" /> Directions
                          </button>
                          {p.googleMapsURI && (
                            <a
                              href={p.googleMapsURI}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="nutri-mono text-[11px] text-[#1c1a1f]/75 hover:text-[#1c1a1f] inline-flex items-center gap-1"
                            >
                              Open in Maps <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StoreLocatorModal({
  accentColor,
  onClose,
  onAskChatAboutStores,
}: {
  accentColor: string;
  onClose: () => void;
  onAskChatAboutStores: (locationText: string) => void;
}) {
  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 95 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {MAPS_API_KEY ? (
        <APIProvider
          apiKey={MAPS_API_KEY}
          language="en"
          region="US"
          libraries={['places', 'marker', 'routes']}
        >
          <StoreLocatorInner
            accentColor={accentColor}
            onClose={onClose}
            onAskChatAboutStores={onAskChatAboutStores}
          />
        </APIProvider>
      ) : (
        <div className="locator-modal p-6 text-center space-y-3" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between">
            <h2 className="disp text-xl m-0">STORE LOCATOR</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1c1a1f] text-[#f0e8e0] border-0 flex items-center justify-center cursor-pointer"
              aria-label="Close store locator"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-[#1c1a1f]/80 m-0">
            Maps API configuration is not present in this environment. You can still ask our Support Assistant for nearby stockists.
          </p>
        </div>
      )}
    </div>
  );
}

/* ==================== AI SUPPORT CHAT DRAWER ==================== */
const STARTER_PROMPTS = [
  'Which bars contain peanuts or tree nuts?',
  'How much do I save with a 3-pack?',
  'Find health food stores near me',
  'Compare Berry Oat vs Mint Chip nutrition',
];

function renderReplyParagraphs(text: string) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        const cleanBold = (segment: string) => {
          const parts = segment.split(/(\*\*[^*]+\*\*)/g);
          return parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
              return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
            }
            return <React.Fragment key={pIdx}>{part}</React.Fragment>;
          });
        };
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="opacity-60">•</span>
              <span>{cleanBold(trimmed.slice(2))}</span>
            </div>
          );
        }
        return (
          <p key={i} className="m-0">
            {cleanBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function SupportChatDrawer({
  accentColor,
  messages,
  setMessages,
  initialDraft,
  onClearInitialDraft,
  onClose,
  onOpenLocator,
}: {
  accentColor: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  initialDraft?: string;
  onClearInitialDraft?: () => void;
  onClose: () => void;
  onOpenLocator: () => void;
}) {
  const [input, setInput] = useState(initialDraft ?? '');
  const [sending, setSending] = useState(false);
  const [userLoc, setUserLoc] = useState<LatLngPoint | null>(null);
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'active' | 'denied'>('idle');
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialDraft) {
      setInput(initialDraft);
      onClearInitialDraft?.();
    }
  }, [initialDraft, onClearInitialDraft]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocStatus('denied');
      return;
    }
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('active');
      },
      () => {
        setLocStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  const sendMessage = useCallback(
    async (textToSend: string) => {
      const trimmed = textToSend.trim();
      if (!trimmed || sending) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: trimmed,
      };
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setInput('');
      setSending(true);

      try {
        const res = await fetch('/api/support-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextHistory
              .filter((m) => !m.error)
              .map((m) => ({ role: m.role, text: m.text })),
            userLocation: userLoc,
          }),
        });

        const data = (await res.json()) as {
          reply?: string;
          mapsLinks?: GroundingMapLink[];
          error?: string;
        };

        if (!res.ok || data.error) {
          throw new Error(data.error || `Request failed (${res.status})`);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `m-${Date.now()}`,
            role: 'model',
            text: data.reply || 'I could not generate a response right now.',
            mapsLinks: Array.isArray(data.mapsLinks) ? data.mapsLinks : [],
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'model',
            text: err instanceof Error ? err.message : 'Unable to reach support chat right now.',
            error: true,
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [messages, sending, setMessages, userLoc],
  );

  return (
    <div
      className="modal-backdrop justify-end p-0 sm:p-4"
      style={{ zIndex: 95 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="support-drawer" role="dialog" aria-modal="true" aria-labelledby="support-chat-title">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-black/10" style={{ background: accentColor }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#1c1a1f] text-[#f0e8e0] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="nutri-mono text-[10px] uppercase tracking-[0.14em] text-[#1c1a1f]/80">
                Care &amp; Stockist Specialist
              </div>
              <h2 id="support-chat-title" className="disp text-lg sm:text-xl m-0 text-[#fbf7f2]">
                JACKIE SWEETS SUPPORT
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1c1a1f] text-[#f0e8e0] border-0 flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close support chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Location & Quick Switch Bar */}
        <div className="px-4 py-2.5 bg-[#fbf7f2] border-b border-black/10 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={requestUserLocation}
            disabled={locStatus === 'loading'}
            className={`nutri-mono text-[11px] px-2.5 py-1 rounded-full border cursor-pointer inline-flex items-center gap-1.5 ${
              locStatus === 'active'
                ? 'bg-[#1c1a1f] text-[#f0e8e0] border-[#1c1a1f]'
                : 'bg-white text-[#1c1a1f] border-black/15 hover:border-black/35'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>
              {locStatus === 'active'
                ? 'Location shared'
                : locStatus === 'loading'
                  ? 'Locating…'
                  : locStatus === 'denied'
                    ? 'Location blocked'
                    : 'Share location for store lookup'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLocator();
            }}
            className="nutri-mono text-[11px] px-2.5 py-1 rounded-full bg-black/5 hover:bg-black/10 text-[#1c1a1f] border-0 cursor-pointer inline-flex items-center gap-1"
          >
            <MapPin className="w-3 h-3" />
            <span>Open Store Map</span>
          </button>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0e8e0]">
          {messages.length === 0 ? (
            <div className="space-y-3 py-2">
              <div className="rounded-2xl bg-[#fbf7f2] p-3.5 border border-black/10 text-sm text-[#1c1a1f] leading-relaxed">
                Ask me anything about Jackie Sweets bars — ingredients, allergens, macros, 3-pack bundles, or local stores carrying plant-based snacks near you.
              </div>
              <div className="space-y-1.5">
                <div className="nutri-mono text-[10px] uppercase tracking-[0.12em] text-[#1c1a1f]/60">
                  Quick Questions
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      className="text-left text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-[#1c1a1f] hover:text-[#f0e8e0] text-[#1c1a1f] border border-black/12 cursor-pointer transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-[#1c1a1f] text-[#f0e8e0]'
                      : msg.error
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-[#fbf7f2] text-[#1c1a1f] border border-black/10'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="m-0 text-sm leading-relaxed">{msg.text}</p>
                  ) : (
                    renderReplyParagraphs(msg.text)
                  )}

                  {msg.mapsLinks && msg.mapsLinks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-black/10 space-y-1.5">
                      <div className="nutri-mono text-[10px] uppercase tracking-[0.12em] text-[#1c1a1f]/65 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>Google Maps Sources</span>
                      </div>
                      {msg.mapsLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl bg-white p-2 border border-black/10 hover:border-black/30 text-[#1c1a1f] no-underline transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                            <span className="truncate">{link.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-65" />
                          </div>
                          {link.reviewSnippets && link.reviewSnippets.length > 0 && (
                            <p className="text-[11px] opacity-75 m-0 mt-1 line-clamp-2">
                              “{link.reviewSnippets[0]}”
                            </p>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {sending && (
            <div className="flex items-center gap-2 text-xs text-[#1c1a1f]/70 pl-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="nutri-mono">Thinking…</span>
            </div>
          )}
          <div ref={threadEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
          className="p-3 bg-[#fbf7f2] border-t border-black/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about allergens, 3-packs, or nearby stores…"
            aria-label="Message Jackie Sweets support"
            className="flex-1 px-4 py-2.5 rounded-full border border-black/18 bg-white text-sm text-[#1c1a1f] outline-none focus:border-[#1c1a1f]"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-full bg-[#1c1a1f] text-[#f0e8e0] border-0 flex items-center justify-center cursor-pointer disabled:opacity-40 shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ==================== FLOATING SUPPORT DOCK ==================== */
export function SupportDock({
  darkTheme,
  onOpenLocator,
  onOpenChat,
}: {
  darkTheme: boolean;
  onOpenLocator: () => void;
  onOpenChat: () => void;
}) {
  return (
    <div
      className={`support-dock${darkTheme ? ' dark' : ''}`}
      role="region"
      aria-label="Customer support and store locator"
    >
      <button
        type="button"
        className="support-dock-btn"
        onClick={onOpenLocator}
        aria-label="Open store locator map"
      >
        <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Find Stores</span>
      </button>
      <button
        type="button"
        className="support-dock-btn support-dock-primary"
        onClick={onOpenChat}
        aria-label="Open support chat"
      >
        <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Support Chat</span>
      </button>
    </div>
  );
}
