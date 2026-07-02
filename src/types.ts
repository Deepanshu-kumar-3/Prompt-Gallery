export interface Prompt {
  id: string;
  title: string;
  image: string;
  prompt: string;
  negativePrompt?: string;
  category: string;
  tags: string[];
  downloads: number;
  views: number;
  likes: number;
  creator: string;
  model: string;
  seed?: string;
  cfg?: number;
  steps?: number;
  sampler?: string;
  featured: boolean;
  trending: boolean;
  createdAt: number;
  updatedAt: number;
  aspectRatio?: string;
}

export const CATEGORIES = [
  "Portrait", "Cinematic", "Anime", "Ghibli", "Fantasy", 
  "Realistic", "Dark", "Nature", "Fashion", "Cars", 
  "Architecture", "Animals", "Wallpaper", "Photography", 
  "Product", "Food", "Minimal", "Logo", "3D", 
  "Pixel Art", "Cyberpunk"
];
