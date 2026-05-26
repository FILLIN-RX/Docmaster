interface CameraConfig {
  videoElement: HTMLVideoElement;
  onFrame?: (imageData: string) => void;
  facingMode?: "user" | "environment";
}

interface CameraService {
  stream: MediaStream | null;
  start: (config: CameraConfig) => Promise<MediaStream>;
  capture: (video: HTMLVideoElement) => string;
  stop: () => void;
}

export const cameraService: CameraService = {
  stream: null,

  async start({
    videoElement,
    onFrame,
    facingMode = "environment",
  }: CameraConfig): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      videoElement.srcObject = this.stream;
      await videoElement.play();

      if (onFrame) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const tick = () => {
          if (!this.stream) return;
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          ctx.drawImage(videoElement, 0, 0);
          onFrame(canvas.toDataURL("image/jpeg", 0.7));
          requestAnimationFrame(tick);
        };
        tick();
      }

      return this.stream;
    } catch (err) {
      console.error("Camera access denied:", err);
      throw err;
    }
  },

  capture(video: HTMLVideoElement): string {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  },

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  },
};
