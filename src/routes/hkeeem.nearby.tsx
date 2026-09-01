import { createFileRoute } from "@tanstack/react-router";
import NearbyDeals from "../components/hkeeem/NearbyDeals";

export const Route = createFileRoute("/hkeeem/nearby")({
  component: NearbyDeals,
});
