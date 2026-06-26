export interface User {
  id: string;
  nickname: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Place {
  id: string;
  photoUrl: string | null;
  address: string;
  placeName: string | null;
  lat: number;
  lng: number;
  memo: string | null;
  createdAt: string;
}

export interface Course {
  id: string;
  userId: string;
  title: string;
  tag: "date" | "travel" | "food" | "cafe" | "walk" | "etc";
  isPublic: boolean;
  places: Place[];
  likes: string[];
  bookmarks: string[];
  likeCount: number;
  authorNickname: string;
  isLiked: boolean;
  isBookmarked: boolean;
  isMine?: boolean;
  createdAt: string;
}

export interface TodaySession {
  id: string;
  userId: string;
  places: Place[];
  startedAt: string;
  status: "recording" | "finished";
}

export type AppTab = "home" | "explore" | "settings";
export type CourseTag = Course["tag"];

export const TAG_LABELS: Record<CourseTag, string> = {
  date: "데이트",
  travel: "여행",
  food: "맛집탐방",
  cafe: "카페투어",
  walk: "산책",
  etc: "기타",
};
