/** Works before a route renders; recovery never clears the person's saved records. */
export function showStartupRecovery(): void {
  const recovery = document.getElementById('startup-recovery');
  if (recovery) recovery.hidden = false;
}
