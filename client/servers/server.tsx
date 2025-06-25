import express from "express";
import cors from "cors";
import scraperRoutes from "./Routes/scraperRoutes";
const app = express();
const PORT = process.env.PORT || 5000;

app.use("/api/scrape", scraperRoutes);

app.listen(PORT, () => {
  console.log(`Server is runing on http://localhost: ${PORT}`);
});
