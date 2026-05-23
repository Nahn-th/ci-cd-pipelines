require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { connectDB } = require("./db");
const { userRouter } = require("./routes/users.routes");
const { courseRoute } = require("./routes/courses.route");
const { videoRoute } = require("./routes/videos.route");
const { quizRouter } = require("./routes/quiz.route");
const { paymentRoute } = require("./routes/payment.route");
const { certificateRouter } = require("./routes/certificate.route");
const { aiAssistantRoute } = require("./routes/aiAssistant.route");
const { chatRoute } = require("./routes/chat.route");
const { categoryRouter } = require("./routes/category.route");

const app = express();

app.use(cors());
app.use(express.json());

// ───── Routes ─────
app.use("/users", userRouter);
app.use("/courses", courseRoute);
app.use("/videos", videoRoute);
app.use("/quizzes", quizRouter);
app.use("/payment", paymentRoute);
app.use("/certificate", certificateRouter);
app.use("/ai-assistant", aiAssistantRoute);
app.use("/chat", chatRoute);
app.use("/categories", categoryRouter);

app.get("/regenerateToken", (req, res) => {
  const rToken = req.headers.authorization?.split(" ")[1];
  const decoded = jwt.verify(rToken, "ARIVU");
  if (decoded) {
    const token = jwt.sign(
      { userId: decoded.userId, user: decoded.user },
      "arivu",
      { expiresIn: "7d" }
    );
    res.status(201).json({ msg: "token created", token });
  } else {
    res.status(400).json({ msg: "not a valid Refresh Token" });
  }
});

app.get("/", (req, res) => {
  try {
    res.status(200).json({ message: "Welcome to SRM's Backend" });
  } catch (err) {
    res.status(400).json({ message: "Some Error Occur. Please Refresh" });
  }
});

// ───── Socket.IO ─────
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
});

// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication required"));

  try {
    const decoded = jwt.verify(token, "SRM");
    socket.userId = decoded.userId;
    socket.userName = decoded.user;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  require("./socket/chatHandler")(io, socket);
});

// ───── Start Server ─────
const PORT = Number(process.env.PORT) || 5001;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`--- connected to port: ${PORT} ---`);
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use (EADDRINUSE). Set a different PORT in your environment, e.g. PORT=5002 npm start`
        );
      } else {
        console.error("Server failed to start:", err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
