import { useState } from "react";
import axios from "axios";

function UploadCsv() {
  const [data, setData] = useState([]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("csv", file);

    try {
      const res = await axios.post("/upload-csv", formData);
      console.log("CSV Data:", res.data); // 👈 consola del navegador
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleUpload} />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default UploadCsv;
