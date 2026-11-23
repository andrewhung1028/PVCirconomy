export type CompanySlide = { id: string; title: string; body: string; image: string; imageAlt: string };

export const companyHero = {
  title: "Make recycling clear.\nKeep solar circular.",
  description: "Make end-of-life solar panel recycling easier to understand and its outcomes easier to document.",
  poster: "/images/solar-circularity.png",
  action: { label: "Read our mission", href: "#mission" },
};

export const companySlides: CompanySlide[] = [
  {
    id: "mission", title: "Our mission",
    body: "Provide clear processing estimates, transparent delivery terms and visibility into the recycling journey while preserving more useful material streams for their next application.",
    image: "/images/circulator-recovery.jpg", imageAlt: "Solar panel materials moving through recovery",
  },
  {
    id: "estimates", title: "Clear processing estimates",
    body: "Start with the panel model, quantity and condition, so the processing estimate is clear before anything moves.",
    image: "/images/pvcirculator-oursolution-poster.jpg", imageAlt: "PV Circulator solar panel recycling line",
  },
  {
    id: "terms", title: "Transparent delivery terms",
    body: "Separate processing from transport costs and agree receiving conditions up front.",
    image: "/images/circulator-poster.jpg", imageAlt: "PV Circulator solar panel recycling equipment",
  },
  {
    id: "journey", title: "Visibility into the recycling journey",
    body: "Document each batch through its recycling journey, from receiving to material outcome.",
    image: "/images/circulator-process.jpg", imageAlt: "PV Circulator separating a solar panel",
  },
  {
    id: "materials", title: "More useful material streams",
    body: "Preserve more useful material streams for their next application.",
    image: "/images/solar-circularity.png", imageAlt: "Solar circularity",
  },
];

export const companyFooterNote = "Company · mission";
