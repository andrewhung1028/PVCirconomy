import type { UnifiedPublicPageProps } from "./unified-public-page";

export const solutionPage: UnifiedPublicPageProps = {
  pageLabel: "Our Solution",
  hero: {
    title: "Owners pay less.\nRecyclers earn more.",
    description: "PV Circulator, material upcycling and EasyCycle work as one connected path from retired panel to documented material outcome.",
    poster: "/images/pvcirculator-oursolution-poster.jpg",
    video: "/videos/pvcirculator-oursolution.mp4",
    action: { label: "Explore the system", href: "#system" },
  },
  sections: [
    {
      id: "system", label: "Connected system", title: "One system. Three connected jobs.",
      body: ["PV Circulator separates the panel, material upcycling protects the value of recovered streams, and EasyCycle connects the physical process to a traceable record."],
      image: "/images/pv-circulator-system.png", imageAlt: "PV Circulator modular solar panel recycling equipment",
      items: ["Separate materials with PV Circulator", "Prepare recovered streams for their next use", "Document the recycling path with EasyCycle"],
      action: { label: "Explore PV Circulator", href: "/pv-circulator/" },
    },
    {
      id: "outcomes", label: "Outcomes", title: "Keep material value in motion.",
      body: ["The connected approach is designed to lower processing cost, preserve cleaner material streams and make the recycling outcome easier to review."],
      image: "/images/circulator-recovery.jpg", imageAlt: "Recovered solar panel materials moving through the separation process",
      action: { label: "Explore material upcycling", href: "/material-upcycling/" },
    },
  ],
  footerNote: "Our Solution · panel owners and recyclers",
};

export const circulatorPage: UnifiedPublicPageProps = {
  pageLabel: "PV Circulator",
  hero: {
    title: "Separate more.\nPreserve more value.",
    description: "Automated layer-by-layer solar panel recycling for cleaner material streams, without chemicals, heat or process water.",
    poster: "/images/circulator-poster.jpg",
    video: "/videos/pv-circulator-operation.mp4",
    action: { label: "Explore the line", href: "#performance" },
  },
  sections: [
    {
      id: "performance", label: "Performance", title: "Built for industrial PV recycling.",
      body: ["A modular, dry physical-separation line developed by TSGC for crystalline-silicon solar panels. Final performance depends on configuration, feedstock, uptime and site conditions."],
      image: "/images/pv-circulator-system.png", imageAlt: "PV Circulator industrial solar panel recycling line",
      items: ["Rated throughput: one panel per minute", "Published material recovery: more than 99% by weight", "Published process energy: under 1 kWh per panel", "Direct operation: one operator"],
      action: { label: "Model the business case", href: "/business-case/" },
    },
    {
      id: "process", label: "Process", title: "Layer by layer. Material by material.",
      body: ["Controlled layer separation keeps glass, cells, frames and polymers in distinct streams so the output requires less secondary sorting."],
      image: "/images/circulator-process.jpg", imageAlt: "PV Circulator separating a solar panel",
      items: ["Automated infeed and measurement", "Frame and junction-box removal", "Controlled layer separation", "Material preparation and traceability"],
      action: { label: "Discuss equipment", href: "/shop/?type=equipment" },
    },
  ],
  footerNote: "PV Circulator technology · developed by TSGC",
};

export const upcyclingPage: UnifiedPublicPageProps = {
  pageLabel: "Material Upcycling",
  hero: {
    title: "Recovered materials.\nReady for what comes next.",
    description: "Preserve cleaner solar material streams, connect them with supporting information and prepare them for the next industrial use.",
    poster: "/images/material-upcycling-website-4-poster.jpg",
    video: "/videos/material-upcycling-website-4.mp4",
  },
  sections: [],
  footerNote: "Recovered material information · confirmed per batch",
};

export const easyCyclePage: UnifiedPublicPageProps = {
  pageLabel: "EasyCycle",
  hero: {
    title: "Every panel.\nA traceable record.",
    description: "Connect receiving, processing, material recovery and downstream destinations in one recycling passport.",
    poster: "/images/recycling-easycycle-poster.jpg",
    video: "/videos/recycling-easycycle.mp4",
  },
  sections: [],
  footerNote: "EasyCycle · recycling records and material traceability",
};

export const aboutPage: UnifiedPublicPageProps = {
  pageLabel: "About us",
  hero: {
    title: "Solar recycling.\nBuilt for clarity.",
    description: "PV Circonomy brings recycling services, recovery technology and traceable material pathways into one customer experience.",
    poster: "/images/PVCirconomy_recycling_hero_poster.jpg",
    video: "/videos/PVCirconomy_recycling_hero_1080p.mp4",
    videoWebm: "/videos/PVCirconomy_recycling_hero_1080p.webm",
    action: { label: "About PV Circonomy", href: "#company" },
  },
  sections: [{
    id: "company", label: "Company", title: "Recycling services and the technology behind them.",
    body: ["PV Circonomy provides US solar panel recycling services using PV Circulator, developed by its parent company TSGC. PV Circonomy also serves as a sales channel for PV Circulator equipment."],
    image: "/images/pv-circulator-system.png", imageAlt: "PV Circulator solar panel recycling equipment",
    action: { label: "Our mission", href: "/mission/" },
  }],
  footerNote: "PV Circonomy · solar panel recycling",
};

export const missionPage: UnifiedPublicPageProps = {
  pageLabel: "Mission",
  hero: {
    title: "Make recycling clear.\nKeep solar circular.",
    description: "Make end-of-life solar panel recycling easier to understand and its outcomes easier to document.",
    poster: "/images/solar-circularity.png",
    action: { label: "Read our mission", href: "#mission" },
  },
  sections: [{
    id: "mission", label: "Mission", title: "Clarity from estimate to material outcome.",
    body: ["Provide clear processing estimates, transparent delivery terms and visibility into the recycling journey while preserving more useful material streams for their next application."],
    image: "/images/circulator-recovery.jpg", imageAlt: "Solar panel materials moving through recovery",
    action: { label: "See our approach", href: "/our-approach/" },
  }],
  footerNote: "Mission · transparent solar panel recycling",
};

export const approachPage: UnifiedPublicPageProps = {
  pageLabel: "Our approach",
  hero: {
    title: "From panel intake\nto documented outcome.",
    description: "Start with the panel information, separate processing from transport and document the batch through its recycling journey.",
    poster: "/images/circulator-process.jpg",
    action: { label: "Follow the approach", href: "#approach" },
  },
  sections: [{
    id: "approach", label: "Approach", title: "A clear path through recycling.",
    body: ["The service begins with the panel model, quantity, condition and location. Processing and transportation are planned separately before receiving terms are confirmed."],
    image: "/images/PVCirconomy_recycling_hero_poster.jpg", imageAlt: "Solar panels moving through a recycling facility",
    items: ["Identify the panel and condition", "Estimate processing and transportation", "Confirm receiving and delivery terms", "Process and document the batch"],
    action: { label: "Start with an estimate", href: "/#pricing" },
  }],
  footerNote: "Our approach · clear terms and documented outcomes",
};

export const contactPage: UnifiedPublicPageProps = {
  pageLabel: "Contact",
  hero: {
    title: "Start with the right\nproject information.",
    description: "Choose the recycling, equipment or recovered-material path so the right information reaches the right team.",
    poster: "/images/circulator-poster.jpg",
    action: { label: "Choose an inquiry path", href: "#contact" },
  },
  sections: [{
    id: "contact", label: "Contact", title: "Prepare the details that move the conversation forward.",
    body: ["For recycling, prepare the panel model, quantity, condition and US location. For equipment, specify your PV Circulator interest and intended market. For materials, identify the stream, application and required documentation."],
    image: "/images/pv-circulator-system.png", imageAlt: "PV Circulator equipment and solar panel recycling line",
    items: ["Solar panel recycling", "PV Circulator equipment", "Recovered materials"],
    action: { label: "Open inquiry options", href: "/shop/" },
  }],
  footerNote: "Contact · recycling, equipment and materials",
};
