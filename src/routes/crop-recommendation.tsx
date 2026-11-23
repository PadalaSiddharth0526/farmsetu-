import { createFileRoute } from "@tanstack/react-router";
import { CropAdvisor } from "@/components/crop-advisor";
import "./crop-recommendation.css";

export const Route = createFileRoute("/crop-recommendation")({
  head: () => ({
    meta: [
      { title: "Crop Recommendation — Telangana Farmers" },
      {
        name: "description",
        content: "Explore seasonal crop candidates, growing guidance and commercial varieties for Telangana districts.",
      },
    ],
  }),
  component: CropRecommendationPage,
});

function CropRecommendationPage() {
  return <CropAdvisor />;
}
