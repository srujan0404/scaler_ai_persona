import { connectDb, closeDb } from "../services/db.service.js";
import { seedKnowledgeBase } from "../services/knowledge.service.js";
import { setAvailability } from "../services/booking.service.js";
import { ingestDocument } from "../services/rag.service.js";

// ---- Resume data (from actual resume) ----

const RESUME_SECTIONS = {
  personal: {
    source: "resume",
    category: "personal",
    content: `Name: Srujan Reddy Dharma (Dharma Srujan Reddy)
Phone: +91 98489 92863
Location: Bengaluru, Karnataka, India
Email: dharmassr@gmail.com
LinkedIn: linkedin.com/srujandharma
YouTube: youtube/@thepapusgang
GitHub: github.com/srujan0404
Currently: SDE Intern at Pazcare, pursuing dual degrees at Scaler School of Technology and BITS Pilani.`,
  },

  education: {
    source: "resume",
    category: "education",
    content: `1. Scaler School of Technology — Bachelor + Masters of Science in Computer Science
   Duration: July 2023 - July 2027
   CGPA: 9.06

2. Birla Institute of Technology and Science (BITS Pilani) — Bachelors of Science in Computer Science
   Duration: July 2023 - July 2026
   CGPA: 8.79

Achievement: Won an AI X Spacetech Hackathon conducted by GalaxEye, Speciale Invest, and Entrepreneur First.`,
  },

  experience_pazcare: {
    source: "resume",
    category: "experience",
    content: `SDE Intern at Pazcare (September 2024 - Present) — Bengaluru, India
- Contributing to the Flex Insurance project enabling employees to select personalized plans within allocated budgets using Flask and GraphQL.
- Built and optimized features across four production-grade systems involving card transactions, insurance policies, and user wallets.
- Improved core B2B2C product performance contributing to a 2× increase in revenue.
- Led development of an AI assistant for internal teams to automate workflows and improve operational efficiency.
- Tech: Flask, GraphQL, Python, production-grade systems`,
  },

  experience_urbancompany: {
    source: "resume",
    category: "experience",
    content: `Project Intern at Urban Company (April 2024 - June 2024) — Bengaluru, India
- Part of the team building Urban Company's Vision Pro app using Swift and VisionOS.
- Implemented hand-tracking and immersive UI components for mixed-reality environments.
- Developed a custom ML model for real-time occlusion handling and wall detection using device sensors.
- Tech: Swift, VisionOS, Machine Learning, AR/MR`,
  },

  skills: {
    source: "resume",
    category: "skills",
    content: `Programming Languages: Java, Python, JavaScript, TypeScript, C++
Frontend: React, Next.js, React Native
Backend: Node.js, Django, Flask, GraphQL
Database: MongoDB
Other: AI/ML, VisionOS, Swift, Open Source contributions, Docker, Kubernetes, DevOps

Key Strengths:
- Full-stack development with production experience
- AI/ML integration in real products
- B2B and B2C product development
- Mixed reality / AR development (Urban Company VisionOS)
- Quick learner — handles diverse tech stacks across internships`,
  },

  project_gemstone: {
    source: "resume",
    category: "projects",
    content: `Gemstone Management System (Django + Next.js)
- Full-stack B2B gemstone inventory platform
- Saved millions by eliminating costly third-party tools
- Built purchase, sales, accounts, and inventory workflows used by 1000+ employees
- Multi-company, multi-currency, and role-based access
- Tech: Django, Next.js, full-stack
- Has demo video available`,
  },

  project_challengemob: {
    source: "resume",
    category: "projects",
    content: `ChallengeMob — Creator Engagement Platform
- Creator-led engagement platform for influencers to interact with communities
- 1000+ active users on the platform
- Partnered with creators bringing a combined reach of 3M+ audience
- Scaled engagement through interactive challenges and community-driven features
- Real product with real users and measurable traction`,
  },

  leadership: {
    source: "resume",
    category: "personal",
    content: `Positions of Responsibility:
- President, Media Club at Scaler School of Technology
- Open source contributor to Layer5 (service mesh project)
- Won AI X Spacetech Hackathon (GalaxEye, Speciale Invest, Entrepreneur First)`,
  },

  whyThisRole: {
    source: "resume",
    category: "whyThisRole",
    content: `Why Srujan is the right fit:

1. Production Experience at Scale: Currently building production systems at Pazcare that handle real card transactions, insurance policies, and user wallets. Not classroom work — real B2B2C product development that contributed to 2× revenue growth.

2. AI/ML Integration Skills: Led development of an AI assistant at Pazcare and won an AI X Spacetech hackathon. Understands how to integrate AI into real products, not just toy demos.

3. Diverse Technical Range: From Django + Next.js full-stack apps (Gemstone Management System) to Swift + VisionOS mixed reality (Urban Company) to Flask + GraphQL backends (Pazcare). Can adapt to any tech stack quickly.

4. Proven Product Builder: ChallengeMob has 1000+ active users and partnerships with creators reaching 3M+ audience. Builds products people actually use.

5. Academic Excellence: 9.06 CGPA at Scaler School of Technology, 8.79 at BITS Pilani — while simultaneously working on real projects and internships.

6. Strong Leadership: President of Media Club at Scaler, open source contributor to Layer5, hackathon winner. Takes initiative beyond assigned work.`,
  },
};

// ---- GitHub README data (fetched from actual repos) ----

const GITHUB_REPOS = [
  {
    source: "github/ParkingLot",
    category: "projects",
    content: `GitHub Repo: ParkingLot (github.com/srujan0404/ParkingLot)
Language: Java
ParkingLot Management System with features including vehicle management (track vehicles entering/exiting), automated ticket generation with validation, entry and exit gate control, support for multiple vehicle types (CAR, BIKE, TRUCK), robust exception handling, comprehensive unit testing with JUnit 5, 11-stage CI/CD pipeline, integrated security scanning, Docker multi-stage builds, and Kubernetes scalable deployment.
Tech stack: Java 20, Spring Boot, JUnit 5, Docker, Kubernetes, CI/CD pipeline.
This demonstrates low-level design, OOP principles, and production-grade DevOps practices.`,
  },
  {
    source: "github/snake-and-ladder",
    category: "projects",
    content: `GitHub Repo: snake-and-ladder (github.com/srujan0404/snake-and-ladder)
Language: Java (Spring Boot)
A Snake and Ladder game implementation with full UML class diagram, showcasing state management and game logic design. Includes entities like Snake, Ladder, Player, Board, Dice with a clean service-oriented architecture. Demonstrates object-oriented design patterns and Spring Boot application structure.`,
  },
  {
    source: "github/twitterBackend",
    category: "projects",
    content: `GitHub Repo: twitterBackend (github.com/srujan0404/twitterBackend)
Language: JavaScript (Node.js, Express)
A Twitter clone backend with user authentication using JWT, MongoDB data storage, RESTful API design, middleware for cookies and CORS, environment variable management with dotenv. Full backend API for a social media platform.`,
  },
  {
    source: "github/twitterFrontend",
    category: "projects",
    content: `GitHub Repo: twitterFrontend (github.com/srujan0404/twitterFrontend)
Language: JavaScript (React, Redux, Tailwind CSS)
Twitter clone frontend built with React, Redux for state management, and Tailwind CSS for styling. Allows users to create posts, follow other users, and view profiles. Companion to the twitterBackend repo — together they form a full-stack Twitter clone.`,
  },
  {
    source: "github/rn-final-assignment",
    category: "projects",
    content: `GitHub Repo: PocketExpense+ (github.com/srujan0404/rn-final-assignment)
Language: JavaScript/TypeScript (React Native)
Smart Expense Tracker mobile app with features: user authentication, manual and automatic expense entry, category-based tracking (Food, Transport, Shopping, Bills, Entertainment, Health), multiple payment methods (Cash, Card, UPI, Net Banking), spending insights and analytics with visual progress bars, offline support with auto-sync, expense filtering and search. Production-ready feature: automatic SMS expense detection from bank transaction alerts with real-time monitoring, intelligent transaction extraction (amount, merchant, date, payment method).`,
  },
  {
    source: "github/design-patterns",
    category: "projects",
    content: `GitHub Repos: design-pattern-assignments, decorator-exercises, beverage_decorator, employee-adapter, singleton-config, builder-orders (github.com/srujan0404)
Language: Java
Collection of design pattern implementations including: Decorator pattern (beverage customization), Adapter pattern (employee system integration), Singleton pattern (configuration management), Builder pattern (order construction). These repos demonstrate strong understanding of SOLID principles and Gang of Four design patterns.`,
  },
  {
    source: "github/Devops-notes",
    category: "projects",
    content: `GitHub Repo: Devops-notes (github.com/srujan0404/Devops-notes)
Weekly DevOps learning notes covering CI/CD pipelines, Docker, Kubernetes, security scanning, and deployment practices. Shows continuous learning and interest in infrastructure and DevOps.`,
  },
  {
    source: "github/overview",
    category: "projects",
    content: `GitHub Profile: github.com/srujan0404
Tech Stack across repos: Java, JavaScript, TypeScript, Python, Dart, React Native, Flutter, React, Redux, Tailwind CSS, Node.js, Express, MongoDB, Spring Boot, Docker, Kubernetes.
Total public repos: 29+, covering LLD assignments, full-stack projects, mobile apps, and DevOps notes. Active contributor to Layer5 open source project.`,
  },
];

// ---- Knowledge base for legacy system prompt (kept for compatibility) ----

const KNOWLEDGE_DATA = {
  name: "Srujan Reddy Dharma",
  personal: RESUME_SECTIONS.personal.content,
  education: RESUME_SECTIONS.education.content,
  experience: RESUME_SECTIONS.experience_pazcare.content + "\n\n" + RESUME_SECTIONS.experience_urbancompany.content,
  skills: RESUME_SECTIONS.skills.content,
  projects: RESUME_SECTIONS.project_gemstone.content + "\n\n" + RESUME_SECTIONS.project_challengemob.content,
  whyThisRole: RESUME_SECTIONS.whyThisRole.content,
};

const AVAILABILITY = {
  timezone: "Asia/Kolkata",
  slotDurationMinutes: 30,
  days: {
    1: { start: "09:00", end: "19:00" },
    2: { start: "09:00", end: "19:00" },
    3: { start: "09:00", end: "19:00" },
    4: { start: "09:00", end: "19:00" },
    5: { start: "09:00", end: "19:00" },
  },
};

async function seed() {
  try {
    await connectDb();

    // 1. Seed legacy knowledge base
    console.log("Seeding knowledge base...");
    await seedKnowledgeBase(KNOWLEDGE_DATA);

    // 2. Ingest resume sections into RAG chunks
    console.log("Ingesting resume into RAG chunks...");
    for (const [key, doc] of Object.entries(RESUME_SECTIONS)) {
      const count = await ingestDocument(doc);
      console.log(`  ${key}: ${count} chunks`);
    }

    // 3. Ingest GitHub repo data into RAG chunks
    console.log("Ingesting GitHub repos into RAG chunks...");
    for (const repo of GITHUB_REPOS) {
      const count = await ingestDocument(repo);
      console.log(`  ${repo.source}: ${count} chunks`);
    }

    // 4. Set availability
    console.log("Setting availability (Mon-Fri 9am-7pm IST)...");
    await setAvailability(AVAILABILITY);

    console.log("\nSeed complete! RAG knowledge base is ready.");
    await closeDb();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
