import { BrowserRouter, Routes, Route } from "react-router-dom";

function SimpleTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'blue' }}>Fylaro Finance - Basic Test</h1>
      <p>If you can see this, the React app is working!</p>
      <button 
        onClick={() => alert('Button clicked!')}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: 'blue', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
}

function Dashboard() {
  return <div style={{ padding: '20px' }}><h1>Dashboard Page</h1></div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SimpleTest />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
