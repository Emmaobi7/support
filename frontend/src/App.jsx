import React, { useState } from 'react'
import Home from './pages/Home'
import DocUpload from './pages/DocUpload'

function App() {
  const [currentPage, setCurrentPage] = useState('home') // 'home' or 'docupload'

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'home' ? (
        <Home onNavigateDocUpload={() => setCurrentPage('docupload')} />
      ) : (
        <DocUpload onNavigateHome={() => setCurrentPage('home')} />
      )}
    </div>
  )
}

export default App