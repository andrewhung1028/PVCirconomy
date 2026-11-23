import type { UnifiedPublicPageProps } from "../components/unified-public-page";

export const companyPage: UnifiedPublicPageProps = {
  pageLabel: "Mission",
  hero: {
    title: "Make recycling clear.\nKeep solar circular.",
    description: "Make end-of-life solar panel recycling easier to understand and its outcomes easier to document.",
    poster: "/images/solar-circularity.png",
    action: { label: "Read our mission", href: "#estimates" },
  },
  sections: [
    {
      id: "estimates", label: "Clear estimates", title: "Clear processing estimates.",
      body: ["Start with the panel model, quantity and condition, so the processing estimate is clear before anything moves."],
      image: "/images/circulator-recovery.jpg", imageAlt: "Solar panel materials moving through recovery",
    },
    {
      id: "terms", label: "Delivery terms", title: "Transparent delivery terms.",
      body: ["Separate processing from transport costs and agree receiving conditions up front."],
      image: "/images/pvcirculator-oursolution-poster.jpg", imageAlt: "PV Circulator solar panel recycling line",
    },
    {
      id: "journey", label: "Recycling journey", title: "Visibility into the recycling journey.",
      body: ["Document each batch through its recycling journey, from receiving to material outcome."],
      image: "/images/circulator-process.jpg", imageAlt: "PV Circulator separating a solar panel",
    },
    {
      id: "materials", label: "Material streams", title: "More useful material streams.",
      body: ["Preserve more useful material streams for their next application."],
      image: "/images/solar-circularity.png", imageAlt: "Solar circularity",
    },
  ],
  footerNote: "Company · mission",
};
