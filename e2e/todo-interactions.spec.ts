import { expect, test } from "@playwright/test";

test("manual todo interactions work without the AI provider", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByText("No todos yet. Generate some or add your own!")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate Todo Items" })).toBeDisabled();

  const addInput = page.getByRole("textbox", { name: "New todo text" });
  await addInput.fill("Draft launch checklist");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Draft launch checklist")).toBeVisible();
  await expect(addInput).toHaveValue("");

  await addInput.fill("Review demo script");
  await addInput.press("Enter");
  await expect(page.getByText("Review demo script")).toBeVisible();
  await expect(addInput).toHaveValue("");

  await page.getByRole("checkbox", { name: "Mark complete: Draft launch checklist" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Mark incomplete: Draft launch checklist" })
  ).toBeChecked();

  await page.getByRole("button", { name: "Edit todo: Review demo script" }).click();
  const editInput = page.getByRole("textbox", {
    name: "Edit todo text: Review demo script",
  });
  await editInput.fill("Discarded edit");
  await page.getByRole("button", { name: "Cancel todo edit: Review demo script" }).click();
  await expect(page.getByText("Review demo script")).toBeVisible();
  await expect(page.getByText("Discarded edit")).toHaveCount(0);

  await page.getByRole("button", { name: "Edit todo: Review demo script" }).click();
  await page
    .getByRole("textbox", { name: "Edit todo text: Review demo script" })
    .fill("Review final demo script");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Review final demo script")).toBeVisible();
  await expect(page.getByText("Review demo script")).toHaveCount(0);

  await page.getByRole("button", { name: "Delete todo: Draft launch checklist" }).click();
  await expect(page.getByText("Draft launch checklist")).toHaveCount(0);
  await expect(page.getByText("Review final demo script")).toBeVisible();

  await page.getByRole("button", { name: "Clear All" }).click();
  await expect(
    page.getByText("No todos yet. Generate some or add your own!")
  ).toBeVisible();
  await expect(page.getByText("Review final demo script")).toHaveCount(0);
});

test("generation failure surfaces a visible retryable error without clearing todos", async ({
  page,
}) => {
  await page.goto("/");

  const addInput = page.getByRole("textbox", { name: "New todo text" });
  await addInput.fill("Keep existing task");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Keep existing task")).toBeVisible();

  await page
    .getByRole("textbox", { name: "What do you want to work on today?" })
    .fill("ship a demo");
  await page.getByRole("button", { name: "Generate Todo Items" }).click();

  await expect(
    page.getByText("Could not generate todos. Check setup and try again.")
  ).toBeVisible();
  await expect(page.getByText("Keep existing task")).toBeVisible();
});

test("keyboard reordering moves todos by stable item identity", async ({ page }) => {
  await page.goto("/");

  const addInput = page.getByRole("textbox", { name: "New todo text" });

  for (const todoText of ["First task", "Second task", "Third task"]) {
    await addInput.fill(todoText);
    await page.getByRole("button", { name: "Add" }).click();
  }

  await expect(page.getByTestId("todo-item")).toHaveText([
    /First task/,
    /Second task/,
    /Third task/,
  ]);

  await page.getByRole("button", { name: "Reorder todo: First task" }).focus();
  await page.keyboard.press("ArrowDown");

  await expect(page.getByTestId("todo-item")).toHaveText([
    /Second task/,
    /First task/,
    /Third task/,
  ]);
});
