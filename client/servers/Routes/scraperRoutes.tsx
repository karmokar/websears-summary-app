import { Router } from "express";
import {
  scrapeCrawlUrl,
  scrapeJsHeavySite,
  searchHistory,
} from "../controllers/ScrapeControllers";
const router = Router();

router.get("/", scrapeCrawlUrl);
router.get("/js", scrapeJsHeavySite);
router.get("/search", searchHistory);

export default router;
