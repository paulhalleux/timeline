export interface Disposable {
  dispose(): void;
}

export function disposable(dispose: () => void): Disposable {
  let disposed = false;

  return {
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      dispose();
    },
  };
}

export class DisposableStore implements Disposable {
  private readonly values: Disposable[] = [];
  private disposed = false;

  get isDisposed(): boolean {
    return this.disposed;
  }

  add<T extends Disposable>(value: T): T {
    if (this.disposed) {
      value.dispose();
      return value;
    }

    this.values.push(value);
    return value;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;

    const errors: unknown[] = [];
    for (let index = this.values.length - 1; index >= 0; index -= 1) {
      try {
        this.values[index].dispose();
      } catch (error) {
        errors.push(error);
      }
    }

    this.values.length = 0;

    if (errors.length === 1) {
      throw errors[0];
    }

    if (errors.length > 1) {
      throw new AggregateError(errors, "Multiple disposables failed while disposing store");
    }
  }
}
