
// Add types for external window libraries
declare global {
  interface Window {
    Tesseract: any;
    pdfjsLib: any;
  }
}

/**
 * Main entry point to extract text from an uploaded file.
 */

export async function readFileAsText(
  file: File,
  serverUrl: string,
): Promise<string> {
  const isImage =
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name) ||
    file.type.startsWith("image/");
  const isPdf =
    file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

  // 1. Image handling (Client-side OCR)
  if (isImage) {
    try {
      return await extractImageTextOcr(file);
    } catch (err: any) {
      throw new Error(
        `Could not extract text from image. Ensure it contains clear text. ${err.message}`,
      );
    }
  }

  // 2. Standard Text handling
  if (!isPdf) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = (e) => res(e.target?.result as string);
      reader.onerror = () => rej(new Error("could not read file"));
      reader.readAsText(file, "utf-8");
    });
  }

  // 3. PDF Handling (Client-side first, fallback to server)

  let pdfText = null;
  try {
    await loadPdfJs();
    pdfText = await extractPdfClientSide(file);
    if (pdfText) return pdfText;
  } catch (err: any) {
    console.warn(
      "Client-side PDF extraction failed, falling back to server...",
      err,
    );
  }
  try {
    return await extractPdfServerSide(file, serverUrl);
  } catch (err: any) {
    throw new Error(`PDF extraction failed completely. Error: ${err.message}`);
  }

  // ── Private Extraction Helpers ──
  async function extractImageTextOcr(file: File): Promise<string> {
    if (!window.Tesseract) {
      await new Promise<void>((res, rej) => {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
        script.onload = () => res();
        script.onerror = () => rej(new Error("Failed to load Tesseract.js"));
        document.head.appendChild(script);
      });
    }

    const buffer = await new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = (e) => res(e.target?.result as string);
      reader.onerror = () => rej(new Error("could not read image"));
      reader.readAsDataURL(file);
    });
    const result = await window.Tesseract.recognize(buffer, "eng");
    const text = result.data.text.trim();
    if (!text) throw new Error("No Text detected in the image");
    return text;
  }
  async function loadPdfJs() {
    if (window.pdfjsLib) return;
    return new Promise<void>((res, rej) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        res();
      };
      script.onerror = () => rej(new Error("could not load pdf.js"));
      document.head.appendChild(script);
    });
  }

  async function extractPdfClientSide(file: File): Promise<string> {
    if (!window.pdfjsLib) throw new Error("pdf.js not loaded");

    const arrayBuffer = await new Promise<ArrayBuffer>((res, rej) => {
      const reader = new FileReader();
      reader.onload = (e) => res(e.target?.result as ArrayBuffer);
      reader.onerror = () => rej(new Error("Could not read PDF file"));
      reader.readAsArrayBuffer(file);
    });

    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer })
      .promise;
    const pageText = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const pages = await pdf.getPage(i);
      const content = await pages.getTextContent();
      const text = content.items.map((item: any) => item.str).join("");
      if (text.trim()) pageText.push(text);
    }

    if (!pageText.length) throw new Error("No text found in PDF");
    return pageText.join("\n");
  }

  async function extractPdfServerSide(
    file: File,
    serverUrl: string,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${serverUrl}/upload/pdf/extract`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok)
      throw new Error(`Server PDF extract failed: ${response.status}`);
    const result=await response.json()
    if (result.text?.trim()) return result.text;
    throw new Error("Server return no text from pdf")
  }
}
