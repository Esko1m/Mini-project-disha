export class DeadReckoning {
  private x: number;
  private y: number;
  private heading: number = 0;
  private stepBuffer: number[] = [];
  private stepThreshold: number;
  private avgStepLength: number;

  constructor(initialX: number, initialY: number, stepLength = 0.75, threshold = 1.2) {
    this.x = initialX;
    this.y = initialY;
    this.avgStepLength = stepLength;
    this.stepThreshold = threshold;
  }

  onAcceleration(ax: number, ay: number, az: number) {
    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    this.stepBuffer.push(magnitude);
    if (this.stepBuffer.length > 5) {
      const peak = Math.max(...this.stepBuffer);
      const trough = Math.min(...this.stepBuffer);
      if (peak - trough > this.stepThreshold) {
        this.applyStep();
        this.stepBuffer = [];
      }
    }
  }

  onMagnetometer(mx: number, my: number) {
    this.heading = (Math.atan2(my, mx) * 180) / Math.PI;
  }

  setHeading(deg: number) {
    this.heading = ((deg % 360) + 360) % 360;
  }

  private applyStep() {
    const rad = (this.heading * Math.PI) / 180;
    this.x += this.avgStepLength * Math.cos(rad);
    this.y += this.avgStepLength * Math.sin(rad);
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  correct(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
