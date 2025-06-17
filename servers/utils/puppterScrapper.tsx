import puppter from "puppeteer";
export default async function scrapeeWithPuppeteer(url: string) {
  const browser = await puppter.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 3000 });
    const title = await page.title();
    const description = await page.evaluate(() => {
      const metaDescription = document.querySelector(
        `meta[name="description"]`
      );
      const twitterDescription = document.querySelector(
        `meta[name="twitter:description"]`
      );
      const ogDescription = document.querySelector(
        `meta[property="og:description"]`
      );
      const firstParagraph = document.querySelector("p")?.innerText;

      return (
        metaDescription?.getAttribute("content")?.trim() ||
        twitterDescription?.getAttribute("content")?.trim() ||
        ogDescription?.getAttribute("content")?.trim() ||
        firstParagraph?.trim() ||
        "No description available"
      );
    });
    return { title, description };
  } catch (error: any) {
    console.error(`Error scrapping with puppter${url}:`, error.message);
    throw new error("Failed to scraped the javascript heavy website");
  } finally {
    await browser.close();
  }
}
