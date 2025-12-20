import { goto } from "$app/navigation";

export const navigateTo = async (path: string) => {
  console.log(`Navigating to: ${path}`);
  await goto(path);
}