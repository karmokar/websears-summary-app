import { Request, Response } from "express";
import crawlWebsite from "../utils/crawlWebsite";
import scrapeeWithPuppeteer from "../utils/puppterScrapper";
import isValidURL from "../utils/urlValidator";
import Search from "../models/Search";
import { timeStamp } from "console";

export const scrapeCrawlUrl = async (res: Response, req: Request) => {
  const { url, depth = 1 } = req.query;

  if (!url || !isValidURL(url as string)) {
    return res.status(400).json({ error: "Invalid or Missing URL" });
  }

  try {
    const results = await crawlWebsite(
      url as string,
      parseInt(depth as string)
    );
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to crawl website" });
  }
};

export const scrapeJsHeavySite = async (res: Response, req: Request) => {
  const { url } = req.query;
  if (!url || !isValidURL(url as string)) {
    return res.status(400).json({ message: "Invalid or missing url" });
  }
  try {
    const result = await scrapeeWithPuppeteer(url as string);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to scrape JS-heavy Site" });
  }
};

export const searchHistory = async (res: Response, req: Request) => {
  const days = parseInt(req.query.days as string) || 30;
  const cutoffDays = new Date();
  cutoffDays.setDate(cutoffDays.getDate() - days);
  try {
    const history = await Search.find({ timeStamp: { $gte: cutoffDays } })
      .sort({ timeStamp: -1 })
      .limit(10);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to Fetch search History" });
  }
};
