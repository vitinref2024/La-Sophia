// Registry to track any images that fail to load at runtime
type Listener = (failedList: string[]) => void;

class ImageTracker {
  private failed = new Set<string>();
  private listeners = new Set<Listener>();

  addFailure(filename: string) {
    if (!this.failed.has(filename)) {
      this.failed.add(filename);
      this.notify();
    }
  }

  removeFailure(filename: string) {
    if (this.failed.has(filename)) {
      this.failed.delete(filename);
      this.notify();
    }
  }

  getFailedList(): string[] {
    return Array.from(this.failed);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const list = this.getFailedList();
    this.listeners.forEach((fn) => fn(list));
  }
}

export const imageTracker = new ImageTracker();
