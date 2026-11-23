import type { UnifiedPublicPageProps } from "../components/unified-public-page";

export const companyPage: UnifiedPublicPageProps = {
  pageLabel: "Company",
  hero: {
    title: "Recycling service.\nEquipment channel.",
    description: "PV Circonomy provides solar panel recycling services with PV Circulator, developed by its parent company TSGC, and sells PV Circulator equipment.",
    poster: "/images/PVCirconomy_recycling_hero_poster.jpg",
    video: "/videos/PVCirconomy_recycling_hero_1080p.mp4",
    videoWebm: "/videos/PVCirconomy_recycling_hero_1080p.webm",
    action: { label: "Meet PV Circonomy", href: "#who" },
  },
  sections: [
    {
      id: "who", label: "Who we are", title: "PV Circonomy in one view.",
      body: [
        "PV Circonomy provides US solar panel recycling services using PV Circulator. It also serves as a sales channel for PV Circulator equipment.",
        "Permitted by the California Department of Toxic Substances Control (DTSC) to receive, process and recycle end-of-life PV panels; R2v3 and ISO 9001/14001/45001 management systems.",
      ],
      image: "/images/circulator-recovery.jpg", imageAlt: "Solar panel materials moving through recovery",
      action: { label: "About us", href: "/about-us/" },
    },
    {
      id: "tsgc", label: "TSGC", title: "TSGC develops. PV Circonomy serves.",
      body: ["TSGC is the parent company of PV Circonomy and the developer of PV Circulator. Each name has its own role:"],
      image: "/images/pv-circulator-system.png", imageAlt: "PV Circulator equipment developed by TSGC",
      items: [
        "PV Circonomy: recycling service provider and equipment sales channel",
        "TSGC: parent company and equipment developer",
        "PV Circulator: the equipment product",
      ],
      action: { label: "About PV Circonomy", href: "/about-us/" },
    },
    {
      id: "circulator", label: "PV Circulator", title: "The equipment behind both businesses.",
      body: ["PV Circonomy uses PV Circulator to deliver its recycling services, and offers the same equipment to customers who want to recycle solar panels themselves."],
      image: "/images/circulator-poster.jpg", imageAlt: "PV Circulator solar panel recycling equipment",
      action: { label: "Explore PV Circulator", href: "/pv-circulator/" },
    },
    {
      id: "mission", label: "Mission", title: "Make recycling clear.",
      body: ["Make end-of-life solar panel recycling easier to understand, with clear processing estimates, delivery terms and visibility into the recycling journey."],
      image: "/images/solar-circularity.png", imageAlt: "Solar circularity",
      action: { label: "Our mission", href: "/mission/" },
    },
    {
      id: "approach", label: "Our approach", title: "From panel information to documented outcome.",
      body: ["Start with the panel model, quantity and condition. Separate processing from transport costs, agree receiving conditions and document the batch through its recycling journey."],
      image: "/images/circulator-process.jpg", imageAlt: "PV Circulator separating a solar panel",
      action: { label: "Our approach", href: "/our-approach/" },
    },
    {
      id: "contact", label: "Contact", title: "Start with the right project information.",
      body: ["For recycling inquiries, prepare your panel model, quantity, condition and US location. For equipment inquiries, specify your interest in PV Circulator."],
      image: "/images/pvcirculator-oursolution-poster.jpg", imageAlt: "PV Circulator solar panel recycling line",
      action: { label: "Contact", href: "/contact/" },
    },
  ],
  footerNote: "Company · PV Circonomy, TSGC and PV Circulator",
};
