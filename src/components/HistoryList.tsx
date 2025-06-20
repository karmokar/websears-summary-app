import React from "react";
interface HistoryItem {
  url: string;
  title: string;
  description: string;
}
interface HistoryListprops {
  items: HistoryItem[];
  onSelect: (url: string) => void;
}

const HistoryList: React.FC<HistoryListprops> = ({ items, onSelect }) => {
  return (
    <div>
      <h2>History</h2>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            cursor: "pointer",
            padding: "10px",
            borderBottom: "1px solid #ccc",
          }}
          onClick={() => {
            onSelect(item.url);
          }}
        ></div>
      ))}
    </div>
  );
};

export default HistoryList;
