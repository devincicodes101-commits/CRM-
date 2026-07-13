"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "leaflet/dist/leaflet.css";

type Job = {
  id: string;
  title: string;
  customer_name: string | null;
  address: string | null;
  site_lat: number | null;
  site_lng: number | null;
};

type RouteMapProps = {
  jobs: Job[];
};

const DEFAULT_CENTER: [number, number] = [51.505, -0.09];

function MapInner({ jobs }: RouteMapProps) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MapContainer, TileLayer, Marker, Popup } = require("react-leaflet");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet");

  const jobsWithCoords = useMemo(
    () => jobs.filter((j) => j.site_lat !== null && j.site_lng !== null),
    [jobs]
  );

  const center: [number, number] = useMemo(() => {
    if (jobsWithCoords.length === 0) return DEFAULT_CENTER;
    const avgLat =
      jobsWithCoords.reduce((s, j) => s + j.site_lat!, 0) / jobsWithCoords.length;
    const avgLng =
      jobsWithCoords.reduce((s, j) => s + j.site_lng!, 0) / jobsWithCoords.length;
    return [avgLat, avgLng];
  }, [jobsWithCoords]);

  const makeIcon = (index: number) =>
    L.divIcon({
      html: `<div style="background:#f97316;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)">${index + 1}</div>`,
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

  return (
    <MapContainer
      center={center}
      zoom={jobsWithCoords.length > 0 ? 11 : 6}
      style={{ height: "500px", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />
      {jobsWithCoords.map((job, i) => (
        <Marker key={job.id} position={[job.site_lat!, job.site_lng!]} icon={makeIcon(i)}>
          <Popup>
            <strong>{job.title}</strong>
            <br />
            {job.customer_name}
            <br />
            {job.address}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

const DynamicMap = dynamic(() => Promise.resolve(MapInner), { ssr: false });

export function RouteMap({ jobs }: RouteMapProps) {
  const jobsWithoutCoords = jobs.filter(
    (j) => j.site_lat === null || j.site_lng === null
  );

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">
        <DynamicMap jobs={jobs} />
      </div>
      {jobsWithoutCoords.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {jobsWithoutCoords.length} job
          {jobsWithoutCoords.length !== 1 ? "s" : ""} have no coordinates and
          won&apos;t appear on the map. Set site lat/lng on the job to show them.
        </p>
      )}
    </div>
  );
}
