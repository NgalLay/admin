"use client"
import useOnlineStatus from '../../hooks/useOnlineStatus';

export default function Home() {
  const isOnline = useOnlineStatus();

  return (
    <div>
      <h1>Internet Status Check</h1>
      {isOnline ? (
        <p style={{ color: 'green' }}>You are online!</p>
      ) : (
        <p style={{ color: 'red' }}>You are offline!</p>
      )}
    </div>
  );
}
