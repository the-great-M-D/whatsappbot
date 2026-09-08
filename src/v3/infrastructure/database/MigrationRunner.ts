export interface MigrationRunner {
  migrate(): Promise<void>
}

/**
 * V3 startup intentionally depends on an injected migration runner rather than
 * performing schema synchronization itself. Deployment owns migration timing.
 */
export class ExplicitMigrationRunner implements MigrationRunner {
  constructor(private readonly apply: () => Promise<void>) {}

  async migrate(): Promise<void> {
    await this.apply()
  }
}
