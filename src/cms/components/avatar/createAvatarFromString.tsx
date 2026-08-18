import { ReactElement } from "react";

export function createAvatarFromString(name: string): string {
  const words = name.trim().split(' ');
  const avatarLetters: string[] = [];
  for (const word of words) {
    if (word.length > 0) avatarLetters.push(word[0]);
  }
  
  return avatarLetters.join('').toUpperCase();
}
export function getAvatarIconFromString(name: string, className: string = ""): ReactElement {
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${className}`}>
      <span className="text-white text-xs">{createAvatarFromString(name)}</span>
    </div>
  )
}