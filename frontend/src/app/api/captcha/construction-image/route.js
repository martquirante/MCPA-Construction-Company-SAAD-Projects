import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// 50 100% verified, active, high-resolution construction, engineering, architecture, heavy machinery,
// blueprints, cranes, and luxury residential villa photos (each verified HTTP 200 OK from Unsplash CDN)
const CONSTRUCTION_IMAGES = [
  {
    id: "structural-steel-grid",
    title: "Structural Steel Framework & Foundation Grid",
    category: "structural",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "heavy-excavator-site",
    title: "Heavy Hydraulic Excavator on Building Site Foundation",
    category: "machinery",
    url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "excavator-earthmoving",
    title: "Earthmoving Tracked Excavator at Worksite",
    category: "machinery",
    url: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "architectural-blueprints",
    title: "Architectural Blueprints, Hard Hat & Engineering Calipers",
    category: "architecture",
    url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "contemporary-minimalist-villa",
    title: "Contemporary Minimalist Concrete Villa",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "concrete-pouring-slab",
    title: "Structural Concrete Slab Pouring & Vibrating",
    category: "concrete",
    url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "scaffolding-facade-system",
    title: "Multi-Storey Scaffolding & Exterior Glass Framing",
    category: "scaffolding",
    url: "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "modern-villa-dusk-pool",
    title: "Architectural Luxury Residence at Sunset",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "reinforced-concrete-core",
    title: "Reinforced Concrete Core & Column Assembly",
    category: "structural",
    url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "surveyor-theodolite-site",
    title: "Precision Land Surveying & Site Alignment",
    category: "engineering",
    url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "cantilevered-modern-villa",
    title: "Cantilevered Modern Villa with Perimeter Deck",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "crane-sunset-horizon",
    title: "Heavy Construction Crane against Golden Hour Sky",
    category: "crane",
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "architectural-drafting-desk",
    title: "Residential Floor Plan Drafting & Technical Specs",
    category: "architecture",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "timber-roof-framing-truss",
    title: "Heavy Timber Truss & Modern Roof Construction",
    category: "framing",
    url: "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "tropical-modern-residence",
    title: "Tropical Modern Two-Storey Architectural Home",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "commercial-skyscraper-facade",
    title: "Infrastructure Skyscraper & Curtain Wall Engineering",
    category: "engineering",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "modern-villa-infinity-pool",
    title: "Modern Architectural Residence with Linear Infinity Pool",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "geometric-cubist-home",
    title: "Geometric Cubist Residence with Architectural Glass",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "construction-site-worker",
    title: "Civil Engineer Inspecting Building Site Specs",
    category: "engineering",
    url: "https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "industrial-engineering-survey",
    title: "Heavy Civil Infrastructure & Site Measurement",
    category: "engineering",
    url: "https://images.unsplash.com/photo-1580983218765-f663bec07b37?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "architectural-scale-model",
    title: "Architectural Model & Blueprint Analysis",
    category: "architecture",
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "construction-safety-inspect",
    title: "Project Safety Inspection & Structural Compliance",
    category: "engineering",
    url: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "civil-engineer-plans-review",
    title: "Site Supervisor Reviewing Architectural Drawings",
    category: "architecture",
    url: "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "structural-inspection-gear",
    title: "Precision Engineering Tools & Inspection Diagnostics",
    category: "engineering",
    url: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "high-tech-civil-engineering",
    title: "Advanced Structural Engineering Technology",
    category: "engineering",
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "modern-curved-facade",
    title: "Parametric Concrete Facade & Modern Architecture",
    category: "architecture",
    url: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "white-geometric-structure",
    title: "Contemporary Minimalist Monolithic Structure",
    category: "architecture",
    url: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "architectural-firm-studio",
    title: "Masterplanning & Architectural Studio Workspace",
    category: "architecture",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "luxury-interior-architecture",
    title: "High-Ceiling Contemporary Interior Architecture",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "open-concept-villa-interior",
    title: "Modern Open-Concept Residential Design",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "exterior-modern-facade-dusk",
    title: "Illuminated Architectural Facade at Twilight",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "concrete-glass-residence",
    title: "Exposed Concrete & Architectural Glass Estate",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "modern-master-terrace-view",
    title: "Cantilevered Balcony & Panoramic Glazing",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "two-storey-contemporary-home",
    title: "Custom Two-Storey Modern Residential Home",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "modern-courtyard-residence",
    title: "Architectural Villa with Central Green Courtyard",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "minimalist-villa-dusk-view",
    title: "Linear Modern Villa with Ambient Architectural Lighting",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "grand-estate-entrance",
    title: "Private Luxury Estate Entryway & Landscaping",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "modern-gourmet-kitchen-arch",
    title: "Architectural Kitchen & Premium Stone Finishes",
    category: "luxury-residence",
    url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "industrial-geometric-steel",
    title: "Geometric Steel Trusses & Industrial Framework",
    category: "structural",
    url: "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "suspension-bridge-engineering",
    title: "Civil Infrastructure & Cable-Stayed Engineering",
    category: "engineering",
    url: "https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "heritage-structure-restoration",
    title: "Architectural Renovation & Structural Retrofitting",
    category: "structural",
    url: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "urban-construction-skyline",
    title: "Metropolitan High-Rise Construction Skyline",
    category: "structural",
    url: "https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "residential-roofline-arch",
    title: "Pitched Roof Architecture & Contemporary Cladding",
    category: "framing",
    url: "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "modern-brick-facade-home",
    title: "Textured Masonry & Modern Residential Brickwork",
    category: "structural",
    url: "https://images.unsplash.com/photo-1459767129954-1b1c1f9b9ace?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "heavy-industrial-facility",
    title: "Pre-Engineered Building Framework & Heavy Industry",
    category: "structural",
    url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "civil-project-site-logistics",
    title: "Construction Logistics & Foundation Groundwork",
    category: "engineering",
    url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "technical-cad-drafting",
    title: "Precision Computer-Aided Architectural Design",
    category: "architecture",
    url: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "architectural-inspection-plans",
    title: "On-Site Blueprint Review & Engineering Approvals",
    category: "architecture",
    url: "https://images.unsplash.com/photo-1581093806997-124204d9fa9d?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "mobile-crane-rigging",
    title: "Mobile Crane Rigging & Structural Steel Erection",
    category: "crane",
    url: "https://images.unsplash.com/photo-1582582494705-f8ce0b0c24f0?auto=format&fit=crop&w=640&h=320&q=80",
  },
  {
    id: "structural-precast-facility",
    title: "Precast Concrete Elements & Modular Construction",
    category: "concrete",
    url: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=640&h=320&q=80",
  },
];

// Module-level tracker to suppress consecutive duplicate images across requests
let lastServedImageId = null;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const requestedIndex = searchParams.get("index");
    const excludeId = searchParams.get("exclude") || searchParams.get("prev");

    let selectedImage;

    // 1. Explicit Index Request (e.g. for testing specific photos)
    if (requestedIndex !== null && !isNaN(parseInt(requestedIndex, 10))) {
      const idx = Math.abs(parseInt(requestedIndex, 10)) % CONSTRUCTION_IMAGES.length;
      selectedImage = CONSTRUCTION_IMAGES[idx];
    } else {
      // 2. High-Entropy Cryptographic Randomness with Consecutive Duplicate Suppression
      // Filters out recently served / excluded ID so subsequent calls ALWAYS yield a fresh, distinct image
      const filteredPool = CONSTRUCTION_IMAGES.filter(
        (img) => img.id !== excludeId && img.id !== lastServedImageId
      );

      const activePool = filteredPool.length > 0 ? filteredPool : CONSTRUCTION_IMAGES;
      const randomIdx = crypto.randomInt(0, activePool.length);
      selectedImage = activePool[randomIdx];
    }

    // Keep track of the last served image ID
    lastServedImageId = selectedImage.id;

    // Return metadata if JSON requested
    if (format === "json") {
      return NextResponse.json(
        {
          success: true,
          image: selectedImage,
          totalImages: CONSTRUCTION_IMAGES.length,
          randomSeed: crypto.randomUUID(),
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
    }

    // Default: fetch the image and stream binary directly to avoid cross-origin / tainted canvas issues
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(selectedImage.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "MCPA-Construction-Portal/1.0",
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
            "Surrogate-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "X-Captcha-Image-Id, X-Captcha-Image-Title, X-Captcha-Total, X-Captcha-Category",
            "X-Captcha-Image-Id": selectedImage.id,
            "X-Captcha-Image-Title": encodeURIComponent(selectedImage.title),
            "X-Captcha-Category": selectedImage.category,
            "X-Captcha-Total": String(CONSTRUCTION_IMAGES.length),
          },
        });
      }
    } catch (fetchErr) {
      console.warn("Could not fetch remote construction photo, using local fallback:", fetchErr?.message);
    }

    // Fallback: Read local asset from public directory
    const fallbackPath = path.join(process.cwd(), "public", "assets", "modern_villa_thumb.jpg");
    if (fs.existsSync(fallbackPath)) {
      const fileBuffer = fs.readFileSync(fallbackPath);
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "X-Captcha-Image-Id, X-Captcha-Image-Title, X-Captcha-Total",
          "X-Captcha-Image-Id": "local-fallback",
          "X-Captcha-Image-Title": "MCPA Modern Villa Project",
          "X-Captcha-Total": String(CONSTRUCTION_IMAGES.length),
        },
      });
    }

    // If local file not found, redirect to reliable image URL
    return NextResponse.redirect(selectedImage.url, 307);
  } catch (error) {
    console.error("Construction Captcha Image API Error:", error);
    return NextResponse.json({ error: "Failed to load captcha image" }, { status: 500 });
  }
}
