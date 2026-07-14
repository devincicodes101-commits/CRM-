"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

export type MapVehicle = {
  id: string;
  name: string;
  registration: string;
  driver: string | null;
  status: string;
  speed: number | null;
  current_lat: number | null;
  current_lng: number | null;
};

const DEFAULT_CENTER: [number, number] = [51.505, -0.09];

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  idle: "bg-amber-500",
  maintenance: "bg-purple-500",
  repair: "bg-red-500",
  offline: "bg-gray-400",
};

function MapInner({ vehicles }: { vehicles: MapVehicle[] }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MapContainer, TileLayer, Marker, Popup } = require("react-leaflet");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet");

  const tracked = useMemo(
    () => vehicles.filter((v) => v.current_lat !== null && v.current_lng !== null),
    [vehicles]
  );

  const center: [number, number] = useMemo(() => {
    if (tracked.length === 0) return DEFAULT_CENTER;
    const lat = tracked.reduce((s, v) => s + v.current_lat!, 0) / tracked.length;
    const lng = tracked.reduce((s, v) => s + v.current_lng!, 0) / tracked.length;
    return [lat, lng];
  }, [tracked]);

  const icon = L.divIcon({
    html: `<div style="background:#6366f1;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)">VA</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <MapContainer
      center={center}
      zoom={tracked.length > 0 ? 10 : 6}
      style={{ height: "320px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />
      {tracked.map((v) => (
        <Marker key={v.id} position={[v.current_lat!, v.current_lng!]} icon={icon}>
          <Popup>
            <strong>{v.name}</strong>
            <br />
            {v.registration}
            <br />
            {v.driver ?? "Unassigned"} · {v.status}
            <br />
            {v.speed ?? 0} mph
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

const DynamicMap = dynamic(() => Promise.resolve(MapInner), { ssr: false });

export function LiveMapWidget({ vehicles }: { vehicles: MapVehicle[] }) {
  const activeCount = vehicles.filter((v) => v.status === "active").length;
  const trackedCount = vehicles.filter(
    (v) => v.current_lat !== null && v.current_lng !== null
  ).length;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b font-semibold text-sm">
        <MapPin className="h-4 w-4 text-indigo-500" />
        Live Fleet Map
        <span className="ml-auto flex items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5">
            {activeCount} active
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            {trackedCount}/{vehicles.length} tracked
          </span>
        </span>
      </div>

      {trackedCount === 0 ? (
        <p className="text-sm text-muted-foreground px-5 py-8 text-center">
          No vehicles with GPS data available.
        </p>
      ) : (
        <DynamicMap vehicles={vehicles} />
      )}

      {vehicles.length > 0 && (
        <>
          <ul className="divide-y max-h-48 overflow-y-auto">
            {vehicles.map((v) => (
              <li key={v.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[v.status] ?? "bg-gray-400")} />
                  <span className="font-medium truncate">{v.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{v.registration}</span>
                </div>
                <span className="text-xs text-muted-foreground capitalize shrink-0">{v.status}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
