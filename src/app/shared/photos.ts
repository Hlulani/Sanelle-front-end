/** The design handoff's photography. Every use keeps the photographer's credit visible. */
export interface Photo {
  src: string;
  alt: string;
  credit: string;
  url: string;
}

export const PHOTOS = {
  grainBowl: {
    src: 'assets/photos/meal-grain-bowl-ella-olsson.jpg',
    alt: 'A colourful bowl of grains and roasted vegetables',
    credit: 'Ella Olsson',
    url: 'https://unsplash.com/photos/vegetable-salad-1547592180-85f173990554',
  },
  riceBeans: {
    src: 'assets/photos/meal-rice-beans-joanna-stolowicz.jpg',
    alt: 'A bowl with rice, beans and colourful vegetables',
    credit: 'Joanna Stołowicz',
    url: 'https://unsplash.com/photos/1714062105876-1756a22c4caf',
  },
  vegetables: {
    src: 'assets/photos/meal-vegetables-nathan-dumlao.jpg',
    alt: 'Vegetable dishes served in bowls',
    credit: 'Nathan Dumlao',
    url: 'https://unsplash.com/photos/1577594412936-01fbd0d88d2c',
  },
  cooking: {
    src: 'assets/photos/cooking-at-home-douglas-fehr.jpg',
    alt: 'A woman chopping vegetables in her home kitchen',
    credit: 'Douglas Fehr',
    url: 'https://unsplash.com/photos/1636647511729-6703539ba71f',
  },
  notebook: {
    src: 'assets/photos/appointment-notebook-justin-morgan.jpg',
    alt: 'A notebook and pen ready for appointment questions',
    credit: 'Justin Morgan',
    url: 'https://unsplash.com/photos/1620275765334-4ed948bb4502',
  },
  groceries: {
    src: 'assets/photos/fresh-groceries-ahmet-koc.jpg',
    alt: 'Fresh vegetables arranged on a kitchen table',
    credit: 'Ahmet Koç',
    url: 'https://unsplash.com/photos/1760445530338-d5cb6c5b2e74',
  },
  reading: {
    src: 'assets/photos/reading-at-home-kailun-zhang.jpg',
    alt: 'A woman reading at home in natural light',
    credit: 'Kailun Zhang',
    url: 'https://unsplash.com/photos/1749704647390-8f696a0be917',
  },
} satisfies Record<string, Photo>;
