/**
 * Seeds high-priority "featured" chunks that surface first for common questions.
 * These are curated summaries that the RAG retrieval will prioritize.
 */

import { connectDb, closeDb, getDb } from "../services/db.service.js";

const COLLECTION = "rag_chunks";

const FEATURED_CHUNKS = [
  {
    source: "featured/github-highlights",
    category: "projects",
    content: `Srujan's GitHub Highlights (github.com/srujan0404 — 130+ repos)

Top Projects:

1. **ParkingLot** (Java 20, Spring Boot, Docker, Kubernetes)
   Enterprise-grade parking-lot management system with vehicle tracking, automated ticketing, 11-stage CI/CD pipeline, security scanning, Docker multi-stage builds, and Kubernetes deployment. Demonstrates production-grade DevOps and LLD skills.

2. **PocketExpense+** / rn-final-assignment (React Native, TypeScript)
   Smart expense-tracker mobile app with AI-powered SMS auto-detection from bank alerts, category analytics, multiple payment methods, spending insights, and offline sync. Production-ready mobile app.

3. **twitterBackend + twitterFrontend** (Node.js, Express, JWT, MongoDB + React, Redux, Tailwind)
   Full-stack Twitter clone — backend with JWT auth, RESTful API, MongoDB; frontend with React, Redux state management, Tailwind CSS. Complete social media platform.

4. **snake-and-ladder** (Java, Spring Boot)
   Classic game with full UML class diagram, service-oriented architecture, clean OOP patterns. Shows strong system design thinking.

5. **bookMyShow-workshop** (JavaScript, Node.js)
   BookMyShow clone with client-server architecture, user management, and payment processing. Full-stack web application.

6. **design-pattern-assignments** (Java)
   Collection of Gang-of-Four design patterns: Decorator, Adapter, Singleton, Builder, Immutable. Shows deep OOP and SOLID understanding.

7. **hld-distributed-live-polling-system** (Python) [Private]
   High-level design implementation of a distributed live polling system. Shows system design at scale.

8. **kv-cache** (Python) [Private]
   Key-value cache implementation for HLD course. Demonstrates distributed systems knowledge.

What the profile shows:
- **Full-stack breadth**: React/Next.js frontends, Node.js/Express/Django backends, React Native mobile
- **Strong OOP & design patterns**: Multiple Java repos with SOLID principles, Gang-of-Four patterns
- **Production-grade DevOps**: Docker, Kubernetes, CI/CD pipelines, security scanning
- **Mobile development**: React Native expense tracker with SMS detection, Flutter apps
- **System design**: Distributed polling system, KV cache, parking lot management
- **Languages**: Java, JavaScript, TypeScript, Python, Swift, Dart, Kotlin, C++`,
    chunkIndex: 0,
    keywords: "github repos projects portfolio parkinglot twitter pocketexpense design patterns snake ladder bookmyshow devops docker kubernetes react native",
    priority: 100,
    metadata: { featured: true },
    createdAt: new Date(),
  },
  {
    source: "featured/resume-projects",
    category: "projects",
    content: `Srujan's Major Projects (from resume — production-grade work):

1. **Gemstone Management System** (Django + Next.js)
   Full-stack B2B gemstone inventory platform that saved millions by eliminating costly third-party tools. Features: purchase, sales, accounts, and inventory workflows used by 1000+ employees. Multi-company, multi-currency, and role-based access. Demo video available.

2. **ChallengeMob** — Creator Engagement Platform
   Creator-led platform enabling influencers to interact with communities. 1000+ active users. Partnered with creators bringing a combined reach of 3M+ audience. Scaled through interactive challenges and community-driven features. A real product with real users and measurable traction.

These are Srujan's most impactful projects — real products used by real people at scale.`,
    chunkIndex: 0,
    keywords: "gemstone management challengemob creator engagement platform django nextjs projects resume production",
    priority: 95,
    metadata: { featured: true },
    createdAt: new Date(),
  },
  {
    source: "featured/experience-summary",
    category: "experience",
    content: `Srujan's Work Experience:

1. **SDE Intern at Pazcare** (September 2024 – Present), Bengaluru
   - Building the Flex Insurance project: employees select personalized plans within allocated budgets using Flask and GraphQL
   - Built and optimized features across 4 production-grade systems: card transactions, insurance policies, user wallets
   - Improved core B2B2C product performance contributing to a 2× increase in revenue
   - Led development of an AI assistant for internal teams to automate workflows
   - Tech: Flask, GraphQL, Python

2. **Project Intern at Urban Company** (April – June 2024), Bengaluru
   - Part of the team building Urban Company's Vision Pro app using Swift and VisionOS
   - Implemented hand-tracking and immersive UI components for mixed-reality environments
   - Developed a custom ML model for real-time occlusion handling and wall detection
   - Tech: Swift, VisionOS, Machine Learning, AR/MR`,
    chunkIndex: 0,
    keywords: "experience work intern pazcare urban company flask graphql swift visionos revenue insurance",
    priority: 95,
    metadata: { featured: true },
    createdAt: new Date(),
  },
  {
    source: "featured/education",
    category: "education",
    content: `Srujan's Education:

1. **Scaler School of Technology** — Bachelor + Masters of Science in Computer Science
   Duration: July 2023 – July 2027 | CGPA: 9.06

2. **BITS Pilani** (Birla Institute of Technology and Science) — B.Sc in Computer Science
   Duration: July 2023 – July 2026 | CGPA: 8.79

Achievement: Won an AI × Spacetech Hackathon conducted by GalaxEye, Speciale Invest, and Entrepreneur First.

Dual degree — pursuing both simultaneously while working internships and building products.`,
    chunkIndex: 0,
    keywords: "education scaler school technology bits pilani cgpa degree computer science hackathon",
    priority: 95,
    metadata: { featured: true },
    createdAt: new Date(),
  },
  {
    source: "featured/skills",
    category: "skills",
    content: `Srujan's Technical Skills:

**Languages**: Java, Python, JavaScript, TypeScript, C++, Swift, Kotlin, Dart
**Frontend**: React, Next.js, React Native, Flutter, Tailwind CSS, Redux
**Backend**: Node.js, Express, Django, Flask, GraphQL, Spring Boot
**Database**: MongoDB, PostgreSQL
**DevOps**: Docker, Kubernetes, CI/CD pipelines, security scanning
**Other**: AI/ML, VisionOS, AR/MR, Open Source (Layer5 contributor)

**Key Strengths**:
- Full-stack development with production experience at Pazcare
- AI/ML integration in real products (AI assistant at Pazcare, hackathon winner)
- B2B and B2C product development (Gemstone System, ChallengeMob)
- Mixed reality / AR development (Urban Company VisionOS)
- Strong OOP & design patterns (multiple Java repos)
- Quick learner — adapts to diverse tech stacks across internships`,
    chunkIndex: 0,
    keywords: "skills languages java python javascript react node django flask graphql docker kubernetes frontend backend",
    priority: 95,
    metadata: { featured: true },
    createdAt: new Date(),
  },
  {
    source: "featured/why-hire",
    category: "whyThisRole",
    content: `Why hire Srujan Reddy Dharma:

1. **Production experience at scale** — Currently building systems at Pazcare that handle real card transactions, insurance policies, and user wallets. Contributed to 2× revenue growth. Not classroom work.

2. **AI/ML integration** — Led development of an AI assistant at Pazcare. Won AI × Spacetech hackathon. Knows how to ship AI in real products.

3. **Diverse technical range** — Django + Next.js (Gemstone System), Swift + VisionOS (Urban Company), Flask + GraphQL (Pazcare), React Native (PocketExpense+). Adapts to any stack.

4. **Proven product builder** — ChallengeMob: 1000+ active users, 3M+ audience reach. Gemstone System: used by 1000+ employees. Builds things people actually use.

5. **Academic excellence** — 9.06 CGPA at Scaler, 8.79 at BITS Pilani — while simultaneously shipping real products and working internships.

6. **Leadership** — President of Media Club at Scaler, open source contributor to Layer5, hackathon winner. Takes initiative.`,
    chunkIndex: 0,
    keywords: "why hire fit role strength candidate production experience pazcare revenue ai hackathon leadership",
    priority: 95,
    metadata: { featured: true },
    createdAt: new Date(),
  },
];

async function seed() {
  try {
    await connectDb();
    const db = getDb();

    // Remove old featured chunks
    await db.collection(COLLECTION).deleteMany({ "metadata.featured": true });

    // Insert new featured chunks
    await db.collection(COLLECTION).insertMany(FEATURED_CHUNKS);
    console.log(`Inserted ${FEATURED_CHUNKS.length} featured chunks`);

    await closeDb();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
