const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("./routes");
const { connectWhatsApp } = require("./middlewares/whatsapp.middleware");
const cookieParser = require("cookie-parser");
dotenv.config();

const app = express();

app.use("/uploads", express.static("uploads"));

const allowedOrigins = [
  "http://localhost:3000",
  "https://yourdomain.com", // ganti saat production
];

app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api", router);

app.listen(5500, async () => {
  console.log("Server running on port 5500");
  await connectWhatsApp();
});
