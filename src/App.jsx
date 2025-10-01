import React, { useState, useRef, useEffect } from 'react'

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [originalImageUrl, setOriginalImageUrl] = useState(null)
  const [invertedBlob, setInvertedBlob] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [zoomModal, setZoomModal] = useState({ isOpen: false, imageSrc: '', title: '' })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPinchDistance, setInitialPinchDistance] = useState(0)
  const [initialZoomLevel, setInitialZoomLevel] = useState(1)
  const fileInputRef = useRef(null)
  const zoomImageRef = useRef(null)

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl)
      }
    }
  }, [originalImageUrl])

  // Zoom functionality
  const openZoom = (imageSrc, title) => {
    setZoomModal({ isOpen: true, imageSrc, title })
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
    document.body.style.overflow = 'hidden' // Prevent background scrolling
  }

  const closeZoom = () => {
    setZoomModal({ isOpen: false, imageSrc: '', title: '' })
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
    setIsDragging(false)
    document.body.style.overflow = 'auto'
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5))
    // Reset pan if zoomed out too much
    if (zoomLevel <= 1) {
      setPanOffset({ x: 0, y: 0 })
    }
  }

  const resetZoom = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  // Mouse/Touch handlers for pan
  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      })
    }
  }

  const handleTouchStart = (e) => {
    if (e.touches.length === 1 && zoomLevel > 1) {
      // Single touch for panning
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      })
    } else if (e.touches.length === 2) {
      // Two fingers for pinch zoom
      e.preventDefault()
      setIsDragging(false)
      const distance = Math.sqrt(
        Math.pow(e.touches[1].clientX - e.touches[0].clientX, 2) +
        Math.pow(e.touches[1].clientY - e.touches[0].clientY, 2)
      )
      setInitialPinchDistance(distance)
      setInitialZoomLevel(zoomLevel)
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      // Single touch panning
      e.preventDefault()
      setPanOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      })
    } else if (e.touches.length === 2) {
      // Two finger pinch zoom
      e.preventDefault()
      const distance = Math.sqrt(
        Math.pow(e.touches[1].clientX - e.touches[0].clientX, 2) +
        Math.pow(e.touches[1].clientY - e.touches[0].clientY, 2)
      )
      
      if (initialPinchDistance > 0) {
        const scale = distance / initialPinchDistance
        const newZoom = Math.min(Math.max(initialZoomLevel * scale, 0.5), 5)
        setZoomLevel(newZoom)
        
        // Reset pan if zoomed out too much
        if (newZoom <= 1) {
          setPanOffset({ x: 0, y: 0 })
        }
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Wheel zoom for desktop
  const handleWheel = (e) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  // Pinch zoom for mobile
  const handleTouchEnd = (e) => {
    setIsDragging(false)
    setInitialPinchDistance(0)
    setInitialZoomLevel(1)
  }

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!file) return

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
      setError('Please select a JPG, PNG, or GIF image')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setError(null)
    setSelectedFile(file)
    setIsProcessing(true)

    try {
      // Create object URL for the original image
      const imageUrl = URL.createObjectURL(file)
      setOriginalImageUrl(imageUrl)
      
      // Create image object for processing
      const img = new Image()
      img.src = imageUrl
      
      img.onload = async () => {
        // Process image inversion
        const inverted = await invertImage(img)
        setInvertedBlob(inverted)
        setIsProcessing(false)
      }

      img.onerror = () => {
        setError('Failed to load image. Please try a different file.')
        setIsProcessing(false)
        URL.revokeObjectURL(imageUrl)
        setOriginalImageUrl(null)
      }
    } catch (err) {
      setError('Error processing image. Please try again.')
      setIsProcessing(false)
    }
  }

  // Core image inversion function
  const invertImage = (img) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Invert RGB pixels (keep alpha unchanged)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i]         // Red
        data[i + 1] = 255 - data[i + 1] // Green
        data[i + 2] = 255 - data[i + 2] // Blue
        // data[i + 3] is alpha - leave unchanged
      }
      
      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob(resolve, 'image/png', 0.9)
    })
  }

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Handle download
  const handleDownload = () => {
    if (!invertedBlob || !selectedFile) return

    const link = document.createElement('a')
    link.href = URL.createObjectURL(invertedBlob)
    
    // Create filename with _inverted suffix
    const originalName = selectedFile.name.split('.')
    const extension = originalName.pop()
    const baseName = originalName.join('.')
    link.download = `${baseName}_inverted.png`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  // Reset function
  const handleReset = () => {
    // Clean up object URLs to prevent memory leaks
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl)
    }
    
    setSelectedFile(null)
    setOriginalImageUrl(null)
    setInvertedBlob(null)
    setIsProcessing(false)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <main style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <img 
            src="/Invertify_LOGO.png" 
            alt="Invertify - Image Color Inverter" 
            style={{ 
              height: '150px',
              width: 'auto'
            }} 
          />
        </div>
        <p style={{ 
          fontSize: '1.1rem',
          color: '#666',
          margin: '0'
        }}>
          Drop an image to invert its colors instantly
        </p>
      </header>

      {/* Upload Zone */}
      {!selectedFile && (
        <section 
          style={{
            border: dragActive ? '3px solid #007bff' : '3px dashed #ccc',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#f8f9fa' : '#ffffff',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'all 0.2s ease'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📸</div>
          <h2 style={{ 
            fontSize: '1.5rem',
            color: '#333',
            marginBottom: '8px'
          }}>
            {dragActive ? 'Drop your image here!' : 'Drop an image here to invert its colors'}
          </h2>
          <p style={{ 
            color: '#666',
            marginBottom: '16px'
          }}>
            or click to browse (JPG, PNG, GIF up to 5MB)
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            style={{ display: 'none' }}
          />
          
          <button
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '120px'
            }}
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
          >
            Choose Image
          </button>
        </section>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          color: '#c33'
        }}>
          <strong>⚠️ {error}</strong>
          <button
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              marginLeft: '8px',
              textDecoration: 'underline'
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          color: '#666'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⚙️</div>
          <p style={{ fontSize: '1.2rem' }}>Inverting your image...</p>
        </div>
      )}

      {/* Image Preview & Download */}
      {originalImageUrl && invertedBlob && !isProcessing && (
        <section style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Original Image */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                fontSize: '1.2rem',
                marginBottom: '12px',
                color: '#333'
              }}>
                Original
              </h3>
              <img
                src={originalImageUrl}
                alt="Original"
                onClick={() => openZoom(originalImageUrl, 'Original Image')}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'zoom-in',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              />
              
              {/* Filename display */}
              {selectedFile && (
                <p style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  marginTop: '8px',
                  marginBottom: '0',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  backgroundColor: '#f8f9fa',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  📄 {selectedFile.name}
                </p>
              )}
            </div>

            {/* Inverted Image */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                fontSize: '1.2rem',
                marginBottom: '12px',
                color: '#333'
              }}>
                Inverted
              </h3>
              <img
                src={URL.createObjectURL(invertedBlob)}
                alt="Inverted"
                onClick={() => openZoom(URL.createObjectURL(invertedBlob), 'Inverted Image')}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'zoom-in',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              />
            </div>
          </div>

          {/* Zoom hint */}
          <p style={{ 
            textAlign: 'center',
            color: '#666',
            fontSize: '0.9rem',
            marginBottom: '24px',
            fontStyle: 'italic'
          }}>
            💡 Click on any image to zoom in
          </p>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleReset}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '16px 32px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                minHeight: '44px',
                minWidth: '200px'
              }}
            >
              🔄 Try Another Image
            </button>
            
            <button
              onClick={handleDownload}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '16px 32px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                minHeight: '44px',
                minWidth: '200px'
              }}
            >
              ⬇️ Download Inverted Image
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center',
        marginTop: '48px',
        padding: '24px',
        borderTop: '1px solid #eee',
        color: '#666'
      }}>
        <p style={{ 
          fontSize: '0.9rem',
          margin: '0'
        }}>
          ✨ 100% client-side • Your images never leave your device
        </p>
      </footer>

      {/* Zoom Modal */}
      {zoomModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default')
          }}
          onClick={(e) => e.target === e.currentTarget && closeZoom()}
        >
          {/* Close button */}
          <button
            onClick={closeZoom}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>

          {/* Zoom controls */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '12px',
              borderRadius: '24px',
              zIndex: 1001
            }}
          >
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: zoomLevel <= 0.5 ? 'not-allowed' : 'pointer',
                opacity: zoomLevel <= 0.5 ? 0.5 : 1,
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              🔍−
            </button>
            
            <button
              onClick={resetZoom}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.9rem',
                cursor: 'pointer',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              1:1
            </button>

            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 5}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: zoomLevel >= 5 ? 'not-allowed' : 'pointer',
                opacity: zoomLevel >= 5 ? 0.5 : 1,
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              🔍+
            </button>
          </div>

          {/* Title */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              zIndex: 1001
            }}
          >
            {zoomModal.title}
          </div>

          {/* Zoom level indicator */}
          <div
            style={{
              position: 'absolute',
              top: '60px',
              left: '20px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              zIndex: 1001
            }}
          >
            {Math.round(zoomLevel * 100)}%
          </div>

          {/* Image container */}
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <img
              ref={zoomImageRef}
              src={zoomModal.imageSrc}
              alt={zoomModal.title}
              style={{
                maxWidth: zoomLevel > 1 ? 'none' : '90vw',
                maxHeight: zoomLevel > 1 ? 'none' : '90vh',
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
              draggable={false}
            />
          </div>

          {/* Instructions */}
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              textAlign: 'center',
              zIndex: 1001
            }}
          >
            {window.innerWidth > 768 ? 
              'Mouse wheel to zoom • Drag to pan • Click outside to close' :
              'Pinch to zoom • Drag to pan • Tap outside to close'
            }
          </div>
        </div>
      )}
    </main>
  )
}
