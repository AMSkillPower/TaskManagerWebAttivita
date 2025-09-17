import React from "react";
import { Software } from "../types";

interface SoftwareCardProps {
  data: Software;
  onClick?: () => void;
}

const SoftwareCard: React.FC<SoftwareCardProps> = ({ data, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="p-4 border rounded shadow hover:shadow-lg cursor-pointer transition bg-white dark:bg-gray-800"
    >
      {data.logo && (
        <img
          src={data.logo}
          alt={data.nomeSoftware}
          className="w-16 h-16 object-contain mb-2 mx-auto"
        />
      )}
      <h2 className="font-semibold text-lg text-center">{data.nomeSoftware}</h2>
    </div>
  );
};

export default SoftwareCard;
