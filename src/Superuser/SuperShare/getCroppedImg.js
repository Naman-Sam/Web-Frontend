// getCroppedImg.js
function createImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", error => reject(error));
      image.setAttribute("crossOrigin", "anonymous"); // required for cross-origin images
      image.src = url;
    });
  }
  
  export default async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    // Force the output dimensions to be 1024 x 724
    const outputWidth = 2880;
    const outputHeight = 1694;
  
    canvas.width = outputWidth;
    canvas.height = outputHeight;
  
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputWidth,
      outputHeight
    );
  
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error("Canvas is empty"));
        }
      }, "image/jpeg");
    });
  }
  