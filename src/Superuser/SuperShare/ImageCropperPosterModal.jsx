import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import superposterGetCroppedImg from './getCroppedImg'; // Ensure this helper forces 1024x724 output
import '../SuperStyle/ImageCropperModal.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const ImageCropperPosterModal = ({ imageUrl, onSave, onCancel, maxWidth, maxHeight }) => {
  // States for the crop position, zoom, and cropped area in pixels
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      // Call the superposter cropping helper which outputs 1024×724 image
      const croppedImageUrl = await superposterGetCroppedImg(imageUrl, croppedAreaPixels);
      // Convert the cropped image URL to a blob then create a new File object.
      fetch(croppedImageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const croppedFile = new File([blob], 'croppedPoster.jpg', { type: 'image/jpeg' });
          onSave(croppedFile, croppedImageUrl);
        });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Crop Poster Image (2880×1694)</h3>
        <div className="crop-container" style={{ width: maxWidth, height: maxHeight }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={2880 / 1694} // Fixed aspect ratio for SuperPoster
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="slider-container">
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button onClick={handleSave}>Save Crop</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperPosterModal;
