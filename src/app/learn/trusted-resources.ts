/** Published patient information linked directly; these are not Sanelle-authored clinical reviews. */
export const TRUSTED_RESOURCES = [
  { title: 'Understanding fibroids', publisher: 'NHS', description: 'Symptoms, scans and treatment options explained in published patient information.', url: 'https://www.nhs.uk/conditions/fibroids/', question: 'Which parts of my report matter most for my symptoms and the options we discuss?' },
  { title: 'Talking about heavy periods', publisher: 'NHS', description: 'Information about heavy periods and what to discuss with a clinician.', url: 'https://www.nhs.uk/conditions/heavy-periods/', question: 'How should we assess and manage the bleeding I have recorded?' },
  { title: 'Making balanced food choices', publisher: 'NHS · Eatwell Guide', description: 'General food-group guidance to help with everyday meal planning.', url: 'https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/', question: 'Are there any dietary needs I should discuss with a registered dietitian?' },
] as const;
