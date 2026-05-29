import { useEffect, useState } from 'react';

export default function TestApi() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://watt-guard.up.railway.app/api/admin/summary')
      .then(res => res.json())
      .then(setData)
      .catch(setError);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      {error && <div className="text-red-500">Error: {error.message}</div>}
      {data && <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
