import { getDb } from "../services/db.service.js";

const COLLECTION = "rag_chunks";

const FEATURED_CHUNKS = [
  {
    source: "featured/github-highlights",
    category: "projects",
    content: `Srujan's GitHub Highlights (github.com/srujan0404 — 130+ repos)

Top Projects:

1. **ParkingLot** (Java 20, Spring Boot, Docker, Kubernetes)
   Enterprise-grade parking-lot management system with vehicle tracking, automated ticketing, 11-stage CI/CD pipeline, security scanning, Docker multi-stage builds, and Kubernetes deployment.

2. **PocketExpense+** / rn-final-assignment (React Native, TypeScript)
   Smart expense-tracker mobile app with AI-powered SMS auto-detection from bank alerts, category analytics, multiple payment methods, spending insights, and offline sync.

3. **twitterBackend + twitterFrontend** (Node.js, Express, JWT, MongoDB + React, Redux, Tailwind)
   Full-stack Twitter clone — backend with JWT auth, RESTful API, MongoDB; frontend with React, Redux state management, Tailwind CSS.

4. **snake-and-ladder** (Java, Spring Boot)
   Classic game with full UML class diagram, service-oriented architecture, clean OOP patterns.

5. **bookMyShow-workshop** (JavaScript, Node.js)
   BookMyShow clone with client-server architecture, user management, and payment processing.

6. **design-pattern-assignments** (Java)
   Collection of Gang-of-Four design patterns: Decorator, Adapter, Singleton, Builder, Immutable.

7. **hld-distributed-live-polling-system** (Python) [Private]
   High-level design implementation of a distributed live polling system.

8. **kv-cache** (Python) [Private]
   Key-value cache implementation for HLD course.

What the profile shows:
- **Full-stack breadth**: React/Next.js frontends, Node.js/Express/Django backends, React Native mobile
- **Strong OOP & design patterns**: Multiple Java repos with SOLID principles
- **Production-grade DevOps**: Docker, Kubernetes, CI/CD pipelines, security scanning
- **Mobile development**: React Native expense tracker with SMS detection
- **System design**: Distributed polling system, KV cache
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
    content: `Srujan's Major Projects (from resume):

1. **Gemstone Management System** (Django + Next.js)
   Full-stack B2B gemstone inventory platform that saved millions by eliminating costly third-party tools. Built purchase, sales, accounts, and inventory workflows used by 1000+ employees. Multi-company, multi-currency, and role-based access.

2. **ChallengeMob** — Creator Engagement Platform
   Creator-led platform enabling influencers to interact with communities. 1000+ active users. Partnered with creators bringing a combined reach of 3M+ audience.`,
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
   - Contributed to the Flex Insurance project enabling employees to select personalized plans within allocated budgets using Flask and GraphQL
   - Built and optimized features across four production-grade systems involving card transactions, insurance policies, and user wallets
   - Improved core B2B2C product performance contributing to a 2× increase in revenue
   - Led development of an AI assistant for internal teams to automate workflows and improve operational efficiency
   - Tech: Flask, GraphQL, Python

2. **Project Intern at Urban Company** (April – June 2024), Bengaluru
   - Part of the team building Urban Company's Vision Pro app using Swift and VisionOS
   - Implemented hand-tracking and immersive UI components for mixed-reality environments
   - Developed a custom ML model for real-time occlusion handling and wall detection using device sensors
   - Tech: Swift, VisionOS, Machine Learning, AR/MR`,
    chunkIndex: 0,
    keywords: "experience work intern pazcare urban company flask graphql swift visionos revenue insurance flex",
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

2. **BITS Pilani** — B.Sc in Computer Science
   Duration: July 2023 – July 2026 | CGPA: 8.79

Achievement: Won an AI × Spacetech Hackathon conducted by GalaxEye, Speciale Invest, and Entrepreneur First.`,
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

Languages: Java, Python, JavaScript, TypeScript, C++
Frontend: React, Next.js, React Native
Backend: Node.js, Django, Flask, GraphQL
Database: MongoDB
Other: AI/ML, VisionOS, Swift, Open Source contributions (Layer5)

Key Strengths:
- Full-stack development with production experience
- AI/ML integration in real products
- B2B and B2C product development
- Mixed reality / AR development (Urban Company VisionOS)
- Quick learner — handles diverse tech stacks across internships`,
    chunkIndex: 0,
    keywords: "skills languages java python javascript react node django flask graphql frontend backend",
    priority: 95,
    metadata: { featured: true },
    createdAt: new Date(),
  },
  {
    source: "featured/why-hire",
    category: "whyThisRole",
    content: `Why hire Srujan:

1. Production experience at scale — building systems at Pazcare handling card transactions, insurance policies, user wallets. Contributed to 2× revenue growth.
2. AI/ML integration — Led AI assistant development at Pazcare. Won AI × Spacetech hackathon.
3. Diverse technical range — Django, Next.js, Flask, GraphQL, Swift, VisionOS, React Native.
4. Proven product builder — ChallengeMob: 1000+ users, 3M+ reach. Gemstone System: 1000+ employees.
5. Academic excellence — 9.06 CGPA at Scaler, 8.79 at BITS Pilani while shipping real products.
6. Leadership — President of Media Club at Scaler, open source contributor to Layer5, hackathon winner.`,
    chunkIndex: 0,
    keywords: "why hire fit role strength candidate production experience",
    priority: 95,
    metadata: { featured: true },
    createdAt: new Date(),
  },
];

export default async function seedFeatured() {
  const db = getDb();
  await db.collection(COLLECTION).deleteMany({ "metadata.featured": true });
  await db.collection(COLLECTION).insertMany(FEATURED_CHUNKS);
  return FEATURED_CHUNKS.length;
}
