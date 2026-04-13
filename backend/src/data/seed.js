import { connectDb, closeDb } from "../services/db.service.js";
import { seedKnowledgeBase } from "../services/knowledge.service.js";
import { setAvailability } from "../services/booking.service.js";

const KNOWLEDGE_DATA = {
  name: "Srujan Reddy Dharma",

  personal: `Name: Srujan Reddy Dharma (Dharma Srujan Reddy)
Phone: +91 98489 92863
Location: Bengaluru, Karnataka, India
Email: dharmassr@gmail.com
LinkedIn: linkedin.com/srujandharma
YouTube: youtube/@thepapusgang
GitHub: github.com/srujan0404
Currently: SDE Intern at Pazcare, pursuing dual degrees at Scaler School of Technology and BITS Pilani.`,

  education: `1. Scaler School of Technology — Bachelor + Masters of Science in Computer Science
   Duration: July 2023 - July 2027
   CGPA: 9.06

2. Birla Institute of Technology and Science (BITS Pilani) — Bachelors of Science in Computer Science
   Duration: July 2023 - July 2026
   CGPA: 8.79

Achievement: Won an AI X Spacetech Hackathon conducted by GalaxEye, Speciale Invest, and Entrepreneur First.`,

  experience: `1. SDE Intern at Pazcare (September 2024 - Present) — Bengaluru, India
   - Contributing to the Flex Insurance project enabling employees to select personalized plans within allocated budgets using Flask and GraphQL.
   - Built and optimized features across four production-grade systems involving card transactions, insurance policies, and user wallets.
   - Improved core B2B2C product performance contributing to a 2× increase in revenue.
   - Led development of an AI assistant for internal teams to automate workflows and improve operational efficiency.
   - Tech: Flask, GraphQL, Python, production-grade systems

2. Project Intern at Urban Company (April 2024 - June 2024) — Bengaluru, India
   - Part of the team building Urban Company's Vision Pro app using Swift and VisionOS.
   - Implemented hand-tracking and immersive UI components for mixed-reality environments.
   - Developed a custom ML model for real-time occlusion handling and wall detection using device sensors.
   - Tech: Swift, VisionOS, Machine Learning, AR/MR`,

  skills: `Programming Languages: Java, Python, JavaScript, TypeScript, C++
Frontend: React, Next.js
Backend: Node.js, Django, Flask, GraphQL
Database: MongoDB
Other: AI/ML, VisionOS, Swift, Open Source contributions

Key Strengths:
- Full-stack development with production experience
- AI/ML integration in real products
- B2B and B2C product development
- Mixed reality / AR development (Urban Company VisionOS)
- Quick learner — handles diverse tech stacks across internships`,

  projects: `1. Gemstone Management System (Django + Next.js)
   - Full-stack B2B gemstone inventory platform
   - Saved millions by eliminating costly third-party tools
   - Built purchase, sales, accounts, and inventory workflows used by 1000+ employees
   - Multi-company, multi-currency, and role-based access
   - Tech: Django, Next.js, full-stack
   - Has demo video available

2. ChallengeMob — Creator Engagement Platform
   - Creator-led engagement platform for influencers to interact with communities
   - 1000+ active users on the platform
   - Partnered with creators bringing a combined reach of 3M+ audience
   - Scaled engagement through interactive challenges and community-driven features
   - Real product with real users and measurable traction

3. GitHub Repositories (github.com/srujan0404):
   - ParkingLot (Java): Low-level design implementation of a parking lot system demonstrating OOP and design patterns.
   - snake-and-ladder (Java): Classic game implementation showcasing state management and game logic design.
   - design-pattern-assignments (Java): Collection of design pattern implementations — decorator, builder, singleton, adapter patterns.
   - twitterBackend + twitterFrontend (JavaScript): Full-stack Twitter clone with separate backend API and frontend client.
   - ecommerce (HTML/JS): E-commerce web application project.
   - rn-final-assignment, rn-assignments (React Native): Mobile app assignments built with React Native and TypeScript.
   - Openvision-Assignment (Dart/Flutter): Mobile app built with Flutter/Dart.
   - bits_db (Java): Database-related project for BITS coursework.
   - visit_counter_assignment (Python): Python web app with visitor counting functionality.
   - Devops-notes: DevOps learning notes and documentation.
   - Tech stack across repos: Java, JavaScript, TypeScript, Python, Dart, React Native, Flutter

4. Open Source Contributions
   - Contributor to Layer5 (open source service mesh project)
   - Active GitHub: github.com/srujan0404

Positions of Responsibility:
- President, Media Club at Scaler School of Technology`,

  whyThisRole: `Why Srujan is the right fit:

1. Production Experience at Scale: Currently building production systems at Pazcare that handle real card transactions, insurance policies, and user wallets. This isn't classroom work — it's real B2B2C product development that contributed to 2× revenue growth.

2. AI/ML Integration Skills: Led development of an AI assistant at Pazcare and won an AI X Spacetech hackathon. Understands how to integrate AI into real products, not just toy demos.

3. Diverse Technical Range: From Django + Next.js full-stack apps (Gemstone Management System) to Swift + VisionOS mixed reality (Urban Company) to Flask + GraphQL backends (Pazcare). Can adapt to any tech stack quickly.

4. Proven Product Builder: ChallengeMob has 1000+ active users and partnerships with creators reaching 3M+ audience. Understands building products people actually use.

5. Academic Excellence: 9.06 CGPA at Scaler School of Technology, 8.79 at BITS Pilani — while simultaneously working on real projects and internships.

6. Strong Leadership: President of Media Club at Scaler, open source contributor to Layer5, hackathon winner. Takes initiative beyond assigned work.`,
};

const AVAILABILITY = {
  timezone: "Asia/Kolkata",
  slotDurationMinutes: 30,
  days: {
    1: { start: "09:00", end: "19:00" }, // Monday
    2: { start: "09:00", end: "19:00" }, // Tuesday
    3: { start: "09:00", end: "19:00" }, // Wednesday
    4: { start: "09:00", end: "19:00" }, // Thursday
    5: { start: "09:00", end: "19:00" }, // Friday
  },
};

async function seed() {
  try {
    await connectDb();
    console.log("Seeding knowledge base...");
    await seedKnowledgeBase(KNOWLEDGE_DATA);
    console.log("Setting availability (Mon-Fri 9am-7pm IST)...");
    await setAvailability(AVAILABILITY);
    console.log("Seed complete!");
    await closeDb();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
