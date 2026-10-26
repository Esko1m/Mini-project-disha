import * as Speech from 'expo-speech';

type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface Utterance {
  text: string;
  priority: Priority;
}

const priorityOrder: Record<Priority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
};

export class TTSQueue {
  private queue: Utterance[] = [];
  private speaking = false;
  private muted = false;
  private generation = 0;

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.generation++;
      Speech.stop();
      this.queue = [];
      this.speaking = false;
    }
  }

  isMuted() {
    return this.muted;
  }

  speak(text: string, priority: Priority = 'normal') {
    if (this.muted) return;
    if (priority === 'urgent') {
      this.generation++;
      Speech.stop();
      this.queue = [];
      this.speaking = false;
      this.queue.unshift({ text, priority });
    } else {
      this.queue.push({ text, priority });
      this.queue.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    }
    if (!this.speaking) this.processQueue();
  }

  private processQueue(generation = this.generation) {
    if (generation !== this.generation) return;

    if (this.muted) {
      this.speaking = false;
      this.queue = [];
      return;
    }
    if (this.queue.length === 0) {
      this.speaking = false;
      return;
    }
    this.speaking = true;
    const next = this.queue.shift();
    if (!next) {
      this.speaking = false;
      return;
    }
    try {
      Speech.speak(next.text, {
        language: 'en-IN',
        rate: 0.9,
        onDone: () => {
          if (generation !== this.generation) return;
          this.processQueue(generation);
        },
        onError: () => {
          if (generation !== this.generation) return;
          this.processQueue(generation);
        },
      });
    } catch {
      this.speaking = false;
      this.processQueue(generation);
    }
  }

  stop() {
    this.generation++;
    Speech.stop();
    this.queue = [];
    this.speaking = false;
  }
}

export const tts = new TTSQueue();
