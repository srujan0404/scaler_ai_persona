import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { connectDb } from "./services/db.service.js";
import chatRoutes from "./routes/chat.routes.js";
import vapiRoutes from "./routes/vapi.routes.js";
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: config.frontendUrl === "*" ? true : config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Scaler AI Persona Backend",
    endpoints: {
      chat: "POST /api/chat",
      vapiWebhook: "POST /api/vapi/webhook",
      availableSlots: "GET /api/bookings/slots",
      bookMeeting: "POST /api/bookings/book",
      calendlyAuth: "GET /auth/calendly",
      calendlyStatus: "GET /auth/calendly/status",
    },
  });
});

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/vapi", vapiRoutes);
app.use("/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

// Start server
async function start() {
  try {
    await connectDb();
    app.listen(config.port, () => {
      console.log(`Backend running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
