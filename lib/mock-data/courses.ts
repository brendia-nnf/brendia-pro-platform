import type { Level, Chapter } from "@/lib/types";

export const mockChapters: Chapter[] = [
  // Level 1 Chapters
  {
    id: "ch-1-1",
    levelId: "level-1",
    chapterNumber: 1,
    title: "Uvod u brendiranje obrva",
    description: "Naučite osnove brendiranja obrva i upoznajte se s alatima.",
    videoDuration: 720,
    thumbnailUrl: "/images/thumbnails/ch-1-1.jpg",
  },
  {
    id: "ch-1-2",
    levelId: "level-1",
    chapterNumber: 2,
    title: "Priprema radnog prostora",
    description: "Kako pravilno pripremiti radno mjesto za rad s klijentima.",
    videoDuration: 540,
    thumbnailUrl: "/images/thumbnails/ch-1-2.jpg",
  },
  {
    id: "ch-1-3",
    levelId: "level-1",
    chapterNumber: 3,
    title: "Osnovne tehnike oblikovanja",
    description: "Savladajte temeljne tehnike oblikovanja obrva.",
    videoDuration: 960,
    thumbnailUrl: "/images/thumbnails/ch-1-3.jpg",
  },
  {
    id: "ch-1-4",
    levelId: "level-1",
    chapterNumber: 4,
    title: "Rad s različitim tipovima kože",
    description: "Prilagodite svoj pristup različitim tipovima kože.",
    videoDuration: 840,
    thumbnailUrl: "/images/thumbnails/ch-1-4.jpg",
  },
  {
    id: "ch-1-5",
    levelId: "level-1",
    chapterNumber: 5,
    title: "Završna obrada i održavanje",
    description: "Naučite pravilnu završnu obradu i savjete za održavanje.",
    videoDuration: 600,
    thumbnailUrl: "/images/thumbnails/ch-1-5.jpg",
  },

  // Level 2 Chapters
  {
    id: "ch-2-1",
    levelId: "level-2",
    chapterNumber: 1,
    title: "Napredne tehnike oblikovanja",
    description: "Unaprijedite svoje vještine s naprednim tehnikama.",
    videoDuration: 1080,
    thumbnailUrl: "/images/thumbnails/ch-2-1.jpg",
  },
  {
    id: "ch-2-2",
    levelId: "level-2",
    chapterNumber: 2,
    title: "Rad s bojama i pigmentima",
    description: "Savladajte teoriju boja i primjenu pigmenata.",
    videoDuration: 900,
    thumbnailUrl: "/images/thumbnails/ch-2-2.jpg",
  },
  {
    id: "ch-2-3",
    levelId: "level-2",
    chapterNumber: 3,
    title: "Korekcije i popravci",
    description: "Naučite kako ispraviti greške i korigirati prijašnji rad.",
    videoDuration: 780,
    thumbnailUrl: "/images/thumbnails/ch-2-3.jpg",
  },
  {
    id: "ch-2-4",
    levelId: "level-2",
    chapterNumber: 4,
    title: "Komunikacija s klijentima",
    description: "Razvijte profesionalne komunikacijske vještine.",
    videoDuration: 660,
    thumbnailUrl: "/images/thumbnails/ch-2-4.jpg",
  },
  {
    id: "ch-2-5",
    levelId: "level-2",
    chapterNumber: 5,
    title: "Izgradnja osobnog brenda",
    description: "Naučite kako izgraditi prepoznatljiv osobni brend.",
    videoDuration: 840,
    thumbnailUrl: "/images/thumbnails/ch-2-5.jpg",
  },
  {
    id: "ch-2-6",
    levelId: "level-2",
    chapterNumber: 6,
    title: "Marketing i društvene mreže",
    description: "Strategije za promociju vašeg posla online.",
    videoDuration: 720,
    thumbnailUrl: "/images/thumbnails/ch-2-6.jpg",
  },

  // Level 3 Chapters (Master)
  {
    id: "ch-3-1",
    levelId: "level-3",
    chapterNumber: 1,
    title: "Master tehnike",
    description: "Ekskluzivne tehnike za vrhunske rezultate.",
    videoDuration: 1200,
    thumbnailUrl: "/images/thumbnails/ch-3-1.jpg",
  },
  {
    id: "ch-3-2",
    levelId: "level-3",
    chapterNumber: 2,
    title: "Vođenje tima i edukacija",
    description: "Kako educirati druge i voditi vlastiti tim.",
    videoDuration: 900,
    thumbnailUrl: "/images/thumbnails/ch-3-2.jpg",
  },
  {
    id: "ch-3-3",
    levelId: "level-3",
    chapterNumber: 3,
    title: "Skaliranje poslovanja",
    description: "Strategije za rast i skaliranje vašeg posla.",
    videoDuration: 1080,
    thumbnailUrl: "/images/thumbnails/ch-3-3.jpg",
  },
];

export const mockLevels: Level[] = [
  {
    id: "level-1",
    levelNumber: 1,
    title: "Razina 1: Osnove",
    description: "Naučite temeljne tehnike brendiranja obrva.",
    chapters: mockChapters.filter((ch) => ch.levelId === "level-1"),
    isLocked: false,
  },
  {
    id: "level-2",
    levelNumber: 2,
    title: "Razina 2: Napredna razina",
    description: "Unaprijedite svoje vještine s naprednim tehnikama.",
    chapters: mockChapters.filter((ch) => ch.levelId === "level-2"),
    isLocked: false,
  },
  {
    id: "level-3",
    levelNumber: 3,
    title: "Razina 3: Master",
    description: "Postanite ekspert s master razinom edukacije.",
    chapters: mockChapters.filter((ch) => ch.levelId === "level-3"),
    isLocked: true, // Future content
  },
];

export function getLevelById(id: string): Level | undefined {
  return mockLevels.find((level) => level.id === id);
}

export function getChapterById(id: string): Chapter | undefined {
  return mockChapters.find((chapter) => chapter.id === id);
}

export function getChaptersByLevelId(levelId: string): Chapter[] {
  return mockChapters.filter((chapter) => chapter.levelId === levelId);
}
