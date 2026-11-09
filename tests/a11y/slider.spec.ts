// Slider keeps keyboard focus on its thumb after a mouse click on the track, so arrow keys work
// straight away (UI-053). Runs on the a11y harness (port 5195).
import { expect, test } from '@playwright/test';

test('clicking the track with a mouse leaves focus on the thumb and arrow keys move it', async ({ page }) => {
  await page.goto('http://localhost:5195/index.html');
  const thumb = page.getByRole('slider', { name: 'Volume', exact: true });
  await thumb.waitFor();
  await thumb.scrollIntoViewIfNeeded();
  // The track is the thumb's positioned parent; click well away from the thumb at 40.
  const track = thumb.locator('xpath=ancestor::*[contains(@class,"relative")][1]');
  const box = (await track.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
  await expect(thumb).toBeFocused();
  const before = Number(await thumb.getAttribute('aria-valuenow'));
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => Number(await thumb.getAttribute('aria-valuenow'))).toBeLessThan(before);
});
