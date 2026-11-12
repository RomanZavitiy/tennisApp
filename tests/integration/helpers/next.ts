// next/navigation's redirect() never returns: Next.js throws a control-flow
// error and turns it into a response. The stub in setup.ts throws this
// instead, so an action that ends in a redirect still stops where it would
// in the app, and a test can tell where it was sent.
export class RedirectSignal extends Error {
  constructor(readonly path: string) {
    super(`redirect(${path})`);
    this.name = "RedirectSignal";
  }
}

/** The path an action redirected to, or its own return value if it didn't. */
export async function redirectOrResult<T>(
  action: Promise<T>,
): Promise<{ redirectedTo: string } | T> {
  try {
    return await action;
  } catch (error) {
    if (error instanceof RedirectSignal) {
      return { redirectedTo: error.path };
    }
    throw error;
  }
}
