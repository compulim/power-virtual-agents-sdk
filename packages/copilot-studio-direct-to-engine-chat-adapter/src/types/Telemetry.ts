export type Telemetry = {
  /**
   * Value to send via HTTP header `x-ms-correlationid`.
   */
  get correlationId(): string | undefined;

  trackException(exception: unknown, customProperties?: Record<string, unknown>): void;
};
