import axios from "axios";
import { load } from "cheerio";
export default async function scrapePage(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const html = response.data;
    const $ = load(html);
    const title = $("title").text().trim();
    const description =
      $(`meta[name="description"]`).attr("content")?.trim() ||
      $(`meta[property="og:description"]`).attr("content")?.trim() ||
      $(`meta[property="twitter:description"]`).attr("content")?.trim() ||
      $("p").first().text().trim() ||
      "No description Available";

    const links: string[] = [];
    $("a").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        if (
          href.startsWith("#") ||
          /^https?:\/\//i.test(href) ||
          href.startsWith("/")
        )
          links.push(href);
      }
    });
    const uniqueLinks = Array.from(new Set(links));
    return { title, description, links: uniqueLinks };
  } catch (error: any) {
    console.error(`Error scrapping ${url}:`, error.message);

    return {
      title: "unknown",
      description: "Failed to Scrappe the Website",
      links: [],
    };
  }
}
