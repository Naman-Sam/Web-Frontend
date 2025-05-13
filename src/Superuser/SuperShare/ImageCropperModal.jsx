import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from './ProductEdit/cropImage';
import '../SuperStyle/ImageCropperModal.css';
import { wrapperFetch } from '../../utils/wrapperfetch';

const ImageCropperModal = ({ imageUrl, onSave, onCancel, maxWidth, maxHeight }) => {
  // States for the crop position, zoom, and cropped area in pixels
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageUrl = await getCroppedImg(imageUrl, croppedAreaPixels);
      // Convert the cropped image url to a blob then create a new File object.
      fetch(croppedImageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
          onSave(croppedFile, croppedImageUrl);
        });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Crop Image</h3>
        <div className="crop-container" style={{ width: maxWidth, height: maxHeight }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1} // Forces a square crop
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

export default ImageCropperModal;
