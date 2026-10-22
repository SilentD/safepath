import { useEffect, useState } from 'react';
import { fetchHealth } from '../lib/fetch-api';

export function HealthBanner() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setMessage(data.message || JSON.stringify(data));
        setStatus('success');
      })
      .catch((err) => {
        console.error('Fetch health error:', err);
        setMessage(err.message);
        setStatus('error');
      });
  }, []);

  if (status === 'loading') {
    return <div className="p-3 text-sm bg-gray-100 rounded-xl">Checking health via Fetch API...</div>;
  }

  if (status === 'error') {
    return (
      <div className="p-3 text-sm bg-red-50 text-red-600 rounded-xl">
        Health Check Failed: {message}
      </div>
    );
  }

  return (
    <div className="p-3 text-sm bg-green-50 text-green-700 rounded-xl">
      Backend Connected: {message}
    </div>
  );
}