// A person's avatar: their photo, or initials when they have none.
//
// Lifted out of StaffDetailPanel and StaffGroupPanel, which each inlined a
// near-identical version of this at a different size - one more copy (for
// dispatchers, who aren't StaffMarkers) was the reason to stop duplicating it a
// third time. Works for anyone with just a name and (maybe) a photo URL, so it
// covers both a responder (StaffMarker.photo) and a dispatcher (UserProfile.photo).
import { memo } from "react";
import { getStaffInitials } from "./staffDisplay";

export type PersonAvatarSize = "xs" | "sm" | "md";

interface PersonAvatarProps {
  name: string;
  photo?: string | null;
  size?: PersonAvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<PersonAvatarSize, string> = {
  // Inline use next to a line of text, e.g. "assigned by <avatar> name".
  xs: "h-4 w-4 text-[7px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs"
};

function PersonAvatarBase({ name, photo, size = "md", className = "" }: PersonAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-100 ${SIZE_CLASSES[size]} ${className}`}
    >
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        getStaffInitials(name)
      )}
    </div>
  );
}

export const PersonAvatar = memo(PersonAvatarBase);
PersonAvatar.displayName = "PersonAvatar";

export default PersonAvatar;
