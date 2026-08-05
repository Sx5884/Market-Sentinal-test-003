This is upgraded version of market sentinel 002

To run this especially after changing folder name of market sentinel 002 follow these steps:

1.run: pnpm --filter @market-sentinel/db exec prisma db push

2. run: pnpm approve-builds(if it ask to remove and reinstalled modules from scratch then approve yes)

A terminal UI should appear.

Use the arrow keys to highlight esbuild.
Press Space to select it.
Press Enter to approve.

3. run: pnpm install

4. run: pnpm --filter @market-sentinel/db generate

5. finally run: pnpm dev
