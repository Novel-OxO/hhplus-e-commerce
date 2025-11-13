import { TestContainerManager } from './common/test-container.manager';

export default async function globalSetup(): Promise<void> {
  await TestContainerManager.start();
}
