import express from "express";
import accountRoutes from "./routes/accountRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", accountRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
