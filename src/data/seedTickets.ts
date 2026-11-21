import type { ComplaintTicket } from "../types/civic";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

export const SEED_TICKETS: ComplaintTicket[] = [
  {
    id: "CL-2026-0101",
    description:
      "Large uprooted rain tree collapsed across both lanes near Indiranagar 100 Feet Road signal, snapping an overhead feeder cable and blocking emergency vehicle access.",
    location: "100 Feet Road, Indiranagar Junction",
    citizenName: "Raghavendra Rao",
    summary:
      "Fallen tree blocking 100 Feet Road lanes with snapped overhead cable",
    detectedLanguage: "English",
    category: "Trees",
    severity: "Critical",
    severityReason:
      "Uprooted tree and downed overhead cable block a major arterial road and create an acute electrocution and collision hazard.",
    department: "Parks & Horticulture Department",
    priorityScore: 96,
    suggestedAction:
      "Cordon 100m perimeter immediately, coordinate Electrical Department to de-energize feeder, and deploy chainsaw clearance crew.",
    status: "In Progress",
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(1),
    analysisSource: "gemini",
  },
  {
    id: "CL-2026-0102",
    description:
      "Streetlight pole #42 near Koramangala 4th Block bus stop is broken and live insulated wires are hanging exposed at shoulder height in standing rainwater.",
    location: "4th Block Bus Stop, Koramangala",
    citizenName: "Meera Nair",
    summary:
      "Broken streetlight with exposed wires hanging near bus stop",
    detectedLanguage: "English",
    category: "Electricity",
    severity: "Critical",
    severityReason:
      "Exposed electrical wires at pedestrian height near wet pavement pose an immediate risk of fatal electrocution.",
    department: "Electrical Department",
    priorityScore: 95,
    suggestedAction:
      "Cut power to streetlight sub-circuit immediately and dispatch emergency line technician to isolate and repair pole #42.",
    status: "Assigned",
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(3),
    analysisSource: "gemini",
  },
  {
    id: "CL-2026-0103",
    description:
      "ಮಲ್ಲೇಶ್ವರಂ 8ನೇ ಕ್ರಾಸ್ ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ಆಳವಾದ ಗುಂಡಿ ಬಿದ್ದಿದ್ದು, ದ್ವಿಚಕ್ರ ವಾಹನ ಸವಾರರಿಗೆ ತುಂಬಾ ಅಪಾಯವಾಗಿದೆ. ನಿನ್ನೆ ರಾತ್ರಿ ಎರಡು ಬೈಕ್‌ಗಳು ಬಿದ್ದಿವೆ.",
    location: "8th Cross Main Road, Malleswaram",
    citizenName: "Ananya Kulkarni",
    summary:
      "Deep dangerous pothole on Malleswaram 8th Cross causing two-wheeler falls",
    detectedLanguage: "Kannada",
    category: "Roads",
    severity: "High",
    severityReason:
      "Deep carriageway pothole has already caused multiple two-wheeler crashes and threatens commuter safety.",
    department: "Roads & Engineering",
    priorityScore: 86,
    suggestedAction:
      "Place reflective warning cones immediately and schedule hot-mix asphalt patching within 12 hours.",
    status: "Pending",
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(6),
    analysisSource: "gemini",
  },
  {
    id: "CL-2026-0104",
    description:
      "Stormwater drain has been overflowing onto the main carriageway near Silk Board service road since morning, mixing sewage with rainwater and flooding shop entrances.",
    location: "Service Road, Near Silk Board Flyover",
    citizenName: "Karthik Subramanian",
    summary:
      "Overflowing stormwater drain flooding Silk Board service road and shops",
    detectedLanguage: "English",
    category: "Drainage",
    severity: "High",
    severityReason:
      "Active drainage overflow is flooding commercial storefronts and creating contaminated waterlogging along a busy transit corridor.",
    department: "Stormwater & Drainage Department",
    priorityScore: 83,
    suggestedAction:
      "Dispatch high-pressure jetting and desilting truck to clear downstream culvert blockage immediately.",
    status: "Pending",
    createdAt: hoursAgo(9),
    updatedAt: hoursAgo(9),
    analysisSource: "gemini",
  },
  {
    id: "CL-2026-0105",
    description:
      "जयनगर 4 ब्लॉक मार्केट के पास मुख्य पानी की पाइपलाइन फट गई है और पिछले 5 घंटों से हजारों लीटर पीने का पानी बर्बाद हो रहा है।",
    location: "4th Block Market Gate, Jayanagar",
    citizenName: "Suresh Sharma",
    summary:
      "Burst drinking water pipeline wasting water near Jayanagar 4th Block Market",
    detectedLanguage: "Hindi",
    category: "Water",
    severity: "High",
    severityReason:
      "Major potable pipeline rupture is causing rapid water loss, low pressure across the ward, and road surface erosion.",
    department: "Water Supply Department",
    priorityScore: 79,
    suggestedAction:
      "Close sector isolation valve, dispatch Water Supply repair crew with clamp collar, and inspect sub-base damage.",
    status: "Assigned",
    createdAt: hoursAgo(14),
    updatedAt: hoursAgo(10),
    analysisSource: "gemini",
  },
  {
    id: "CL-2026-0106",
    description:
      "Three community waste bins behind Whitefield Main Market have not been cleared for four days; overflowing garbage is blocking the footpath and attracting stray dogs.",
    location: "Behind Whitefield Main Market, Ward 84",
    citizenName: "Priya Deshmukh",
    summary:
      "Overflowing uncollected garbage bins blocking footpath at Whitefield Market",
    detectedLanguage: "English",
    category: "Waste",
    severity: "Medium",
    severityReason:
      "Multi-day garbage accumulation creates sanitation and odor hazards for market pedestrians without immediate structural danger.",
    department: "Sanitation Department",
    priorityScore: 62,
    suggestedAction:
      "Schedule priority compactor pickup, clear footpath spillover, and spray disinfectant around bin bay.",
    status: "Resolved",
    createdAt: hoursAgo(26),
    updatedAt: hoursAgo(5),
    analysisSource: "gemini",
  },
];

export interface SampleComplaintPreset {
  label: string;
  language: string;
  description: string;
  location: string;
  citizenName: string;
}

export const MULTILINGUAL_PRESETS: SampleComplaintPreset[] = [
  {
    label: "English — Exposed Feeder Cable",
    language: "English",
    description:
      "High-voltage junction box door is broken open and sparking intermittently beside the government primary school gate after light rain.",
    location: "Near Govt Primary School Gate, HSR Layout Sector 2",
    citizenName: "Vikram Menon",
  },
  {
    label: "ಕನ್ನಡ — Pothole & Waterlogging",
    language: "Kannada",
    description:
      "ರಾಜಾಜಿನಗರ ಮೆಟ್ರೋ ನಿಲ್ದಾಣದ ಹತ್ತಿರ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಇದ್ದು ಮಳೆ ನೀರು ತುಂಬಿ ವಾಹನಗಳಿಗೆ ಅಪಾಯವಾಗಿದೆ. ತಕ್ಷಣ ಸರಿಪಡಿಸಿ.",
    location: "Near Rajajinagar Metro Station Entrance",
    citizenName: "Deepak Gowda",
  },
  {
    label: "हिन्दी — Overflowing Garbage & Drain",
    language: "Hindi",
    description:
      "इंदिरानगर बस डिपो के पीछे नाला जाम होकर सड़क पर बह रहा है और पास में कचरा भी जमा है जिससे बदबू फैल रही है।",
    location: "Behind Indiranagar Bus Depot, 12th Main",
    citizenName: "Neha Verma",
  },
];
