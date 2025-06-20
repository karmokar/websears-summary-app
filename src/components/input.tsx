import React, { useState, useEffect, FormEvent } from "react";
import axios from "axios";
import HistoryList from "./HistoryList";
import OutputBox from "./OutputBox";

interface ScrapeResult {
  url: string;
  description: string;
  title: string;
}

const handelSelect=(url:string)=>{

}

const Input: React.FC = () => {
  const [url, setUrl] = useState("");
  const [history, setHistory] = useState<ScrapeResult[]>([]);
  const [Output, setOutput] = useState<ScrapeResult[] | null>([]);
  const [error, setError] = useState<string | null>(null);
  const handelSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError("Pls Enter a Url");
      return;
    }
    try {
      const response = await axios.get<ScrapeResult[]>(
        `http://localhost:5000/api/scrape?url=${encodeURIComponent(url)}`
      );
      setOutput(response.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to scrape the website");
    }
  };
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get<ScrapeResult[]>(
          "http://localhost:5000/api/history"
        );
        setHistory(res.data);
      } catch (err: any) {
        console.error("Failed to load History");
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="container">
      <form onSubmit={handelSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter the Url to Scrape"
        />
        <button>Scrape</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {Output && <OutputBox data={Output} />}
      <h3>Recent Search History</h3>
      <HistoryList items={history} onSelect={handelSelect}/>
    </div>
  );
};
export default Input;
