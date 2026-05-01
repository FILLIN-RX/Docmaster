/**
 * Camera Utility for DocMaster
 * Handles camera access, streaming, and capturing photos.
 */

class CameraService {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.activeCallback = null;
  }

  /**
   * Request camera access and start streaming
   * @param {HTMLVideoElement} videoEl 
   */
  async start(videoEl) {
    try {
      this.videoElement = videoEl;
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer back camera
        audio: false
      });
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      return false;
    }
  }

  /**
   * Stop the camera stream
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Capture a photo from the current stream
   * @returns {Promise<Blob>}
   */
  async capture() {
    if (!this.videoElement || !this.stream) return null;

    if (!this.canvasElement) {
      this.canvasElement = document.createElement('canvas');
    }

    const video = this.videoElement;
    const canvas = this.canvasElement;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  }
}

export const cameraService = new CameraService();
window.cameraService = cameraService;
