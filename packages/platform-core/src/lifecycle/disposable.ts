export interface Disposable {
  dispose(): void;
}

export interface DisposableScope extends Disposable {
  readonly disposed: boolean;
  add<T extends Disposable>(value: T): T;
  onDispose(callback: () => void): Disposable;
}

export function disposable(dispose: () => void): Disposable {
  let disposed = false;
  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      dispose();
    },
  };
}

export function createDisposableScope(): DisposableScope {
  const values: Disposable[] = [];
  let isDisposed = false;
  return {
    get disposed() {
      return isDisposed;
    },
    add<T extends Disposable>(value: T): T {
      if (isDisposed) {
        value.dispose();
        return value;
      }
      values.push(value);
      return value;
    },
    onDispose(callback) {
      return this.add(disposable(callback));
    },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
      const errors: unknown[] = [];
      for (let index = values.length - 1; index >= 0; index -= 1) {
        try {
          values[index]?.dispose();
        } catch (error) {
          errors.push(error);
        }
      }
      values.length = 0;
      if (errors.length === 1) throw errors[0];
      if (errors.length > 1) throw new AggregateError(errors, "Multiple disposables failed while disposing scope");
    },
  };
}
