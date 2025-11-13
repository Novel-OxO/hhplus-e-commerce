import { TestContainerManager } from './common/test-container.manager';

export default async function globalTeardown(): Promise<void> {
  await TestContainerManager.stop();
}
