# PRD: ## 🎯 One-Hour MVP Goal
Create a **dead-simple image inverter** where users drop/upload an image → see instant negative preview → click download. Zero friction, zero dependencies, zero servers." — Image Negative Converter
**Purpose:** Speed-run a minimal web MVP in ~30 minutes  
**Tech Stack:** React + Vite (client-side only)  
**Date:** 2025-09-11

---

## 🎯 One-Hour MVP Goal
Create a **dead-simple image inverter** where users drop/upload an image → see instant negative preview → click download. Zero friction, zero dependencies, zero servers.nvertify” — Image Negative Converter (Web)
**Version:** 0.1  
**Owner:** AG
**Date:** 2025-09-11

---

## 1) Overview / One‑liner
A zero-friction, client-only web tool that lets a user upload an image (JPEG/PNG/GIF/WEBP), instantly inverts its colors to a photographic negative in-browser, and downloads the result—no sign-in, no server.

## ⚡ Core User Flow (30-second experience)
1. **Land on page** → see clean upload zone with "Drop image to invert"
2. **Upload/drag image** → instant preview appears (original + inverted side-by-side)  
3. **Click "Download"** → get inverted image as PNG
4. **Done!** → optionally try another image

## 🎨 Minimal UI Components
- **Header**: "Invertify" title + tagline
- **Upload Zone**: Dashed border, file input + drag-drop
- **Preview Area**: Original image | Inverted image (side-by-side or stacked on mobile)
- **Download Button**: Appears after processing, downloads PNG
- **Footer**: "100% client-side • No images leave your device"

## 🚀 MVP Features (Must-Have)
### Core Functionality
- [ ] File input (button + drag-and-drop support)
- [ ] Image preview (canvas-based rendering)  
- [ ] Color inversion (RGB only, preserve alpha)
- [ ] Download as PNG (single click)
- [ ] Basic error handling (wrong file type, too large)

### Quick Wins
- [ ] Responsive layout (works on mobile)
- [ ] Loading state while processing
- [ ] Clear visual feedback (success/error states)

## 🌟 Stretch Goals (If Time Allows)
- Multiple format support (keep original format)
- Side-by-side comparison view
- Drag to replace current image
- Basic accessibility (keyboard nav, ARIA labels)

## 🔧 Technical Implementation 

### React Components Structure
```
App.jsx
├── Header (title + tagline)  
├── UploadZone (file input + drag-drop)
├── ImagePreview (original + inverted canvases)
├── DownloadButton (appears after processing)
└── Footer (privacy note)
```

### State Management (useState)
```javascript
const [selectedFile, setSelectedFile] = useState(null);
const [originalImage, setOriginalImage] = useState(null); 
const [invertedBlob, setInvertedBlob] = useState(null);
const [isProcessing, setIsProcessing] = useState(false);
const [error, setError] = useState(null);
```

### Core Image Processing Flow
1. **File Selection** → validate type/size → create Image object
2. **Canvas Drawing** → draw image → getImageData() 
3. **Pixel Inversion** → loop through pixels, invert RGB values
4. **Blob Creation** → putImageData() → canvas.toBlob() → trigger download

## 8) Functional Requirements
- **FR1**: Accept input via file picker and drag‑and‑drop; validate file type and size.
- **FR2**: Read image, correct EXIF orientation, draw to `<canvas>`.
- **FR3**: Invert per‑pixel RGB (alpha unchanged), update preview in real time.
- **FR4**: Provide **Download** as PNG (default) and try to preserve original format when safe.
- **FR5**: Error states: unsupported format, too large, corrupted image → show friendly message with retry.

---

## 9) Non‑Functional Requirements
- **Performance**: Handle images up to ~12MP with target processing <2s on desktop; memory-safe on mobile.
- **Compatibility**: Latest Chrome, Edge, Safari, Firefox (desktop and mobile). Graceful fallback if WebP unsupported.
- **Accessibility**: WCAG 2.1 AA basics—color contrast, keyboard nav, ARIA labels, informative error text.
- **Reliability**: No crashes on large images; guard against canvas tainting for cross-origin images.

---

## 10) Privacy, Security & Compliance
- **Privacy**: 100% client-side; no image leaves the device. Prominent disclosure: “Images are processed in your browser—never uploaded.”
- **Security**: No persistent storage by default; optional recent-file memory only in session (if added later).
- **Compliance**: Static site; no PII collection; no cookies or tracking in MVP.

---

## 11) UX Notes & Microcopy
- Minimal, playful, intuitive vibe: “Drop an image to invert its world.”
- Empty state shows a dashed dropzone and “Upload or drop an image”.
- Toast for success/failure; disable **Download** until processing is complete.

## 📋 30-Minute Build Checklist

### Phase 1: Setup (5 minutes)
- [ ] Create basic React components structure
- [ ] Add basic CSS for upload zone and layout
- [ ] Implement file input with drag-drop handlers

### Phase 2: Core Logic (15 minutes) 
- [ ] Handle file selection and validation
- [ ] Implement canvas image drawing
- [ ] Add pixel inversion algorithm  
- [ ] Wire up download functionality

### Phase 3: Polish (10 minutes)
- [ ] Add loading states and error handling
- [ ] Improve responsive layout
- [ ] Test with different image formats
- [ ] Add basic styling and UX polish

## 🎨 Microcopy & UX
- **Empty state**: "Drop an image here to invert its colors"
- **Processing**: "Inverting your image..."  
- **Success**: Download button appears with filename
- **Error**: "Please try a different image (JPG, PNG, or GIF)"
- **Footer**: "✨ 100% client-side • Your images never leave your device"

## 💻 Reference Implementation Snippet

```javascript
// Core inversion function (keep it simple for MVP)
async function invertImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Invert RGB pixels (keep alpha unchanged)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];     // Red
        data[i + 1] = 255 - data[i + 1]; // Green  
        data[i + 2] = 255 - data[i + 2]; // Blue
        // data[i + 3] is alpha - leave unchanged
      }
      
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(resolve, 'image/png', 0.9);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
```

---

## 🚦 Success Criteria
**MVP is ready when:**
- ✅ User can drag/drop or select an image file
- ✅ Image appears with inverted colors preview  
- ✅ Download button works and produces correct PNG
- ✅ Basic error handling for unsupported files
- ✅ Mobile-responsive layout

**Ship it!** 🎉 Then iterate based on user feedback.